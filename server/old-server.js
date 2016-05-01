function resolveConnection(connections, socket) {
  for (var c = 0; c < connections.length; c++) {
    if (connections[c].socket.remoteAddress == socket.remoteAddress &&
        connections[c].socket.remoteFamily == socket.remoteFamily &&
        connections[c].socket.remotePort == socket.remotePort)
        {
          return c;
        }
  }
  return -1;
}

module.exports = function ChatServer(port) {
  const net = require('net');
  port = port || 8000;
  var connections = [];
  var anoncursor = 1;
  var server = net.createServer().on('error', (err) => {
    // handle errors here
    throw err;
  }).on('connection', (socket) => {
    connections.push({
      socket: socket,
      nick: 'Anonymous' + (anoncursor++)
    });
    console.log('Anonymous' + (anoncursor++) + " connected from " + socket.remoteAddress);
    socket.on('close', (had_error) => {
      c = resolveConnection(connections, socket);
      if (c != -1)
        connections.splice(c, 1);
    });
    socket.on('end', () => {
      c = resolveConnection(connections, socket);
      if (c != -1)
        connections.splice(c, 1);
    });
    socket.on('data', (data) => {
      data = data.toString();
      var user = connections[resolveConnection(connections, socket)];
      console.log('Received', data.trim(), 'from', user.nick, 'at', socket.remoteAddress);
      if (data.trim().indexOf('/nick') == 0) {
        var nick = data.trim().substring(5).trim();
        var old = user.nick;
        if (nick)
          user.nick = nick;
        for (var c = 0; c < connections.length; c++) {
          socket.write(JSON.stringify({ message: old + " is now known as " + nick }));
        }
      }
      else if (data.trim() == '/who') {
        var users = { users: [], message: 'The following users are online:\n'};
        for (var c = 0; c < connections.length; c++) {
          users.users.push(connections[c].nick);
          users.message += connections[c].nick + '\n';
        }
        socket.write(JSON.stringify(users));
      }
      else for (var c = 0; c < connections.length; c++) {
        if (connections[c].socket.remoteAddress != socket.remoteAddress ||
            connections[c].socket.remoteFamily != socket.remoteFamily ||
            connections[c].socket.remotePort != socket.remotePort)
            {
              if (connections[c].socket.writable)
                connections[c].socket.write(JSON.stringify({
                  nick: user.nick,
                  message: data,
                }));
            }
      }
    });
  });

  server.listen({port: port}, () => {
    address = server.address();
    console.log('Started server on %j', address);
  });

  // var server = net.connect(host, port, () => {
  //   console.log('Connected to host ' + host + ':' + port);
  // });
  server.on('end', () => {
    console.log('Disconnected from host ' + host + ':' + port);
  });
  const disconnect = () => {
    //client.end();
  };
  const received = (message) => {
    //client.write(message);
  };
  return {
    port: port,
    connections: connections,
    server: server,
    // onMessage: onMessage
  };
};
