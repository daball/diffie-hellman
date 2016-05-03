function bold(html) { return "<b>"+html+"</b>"; }
function underline(html) { return "<u>"+html+"</u>"; }
const br = '<br />';

function resolveConnectionBySocket(connections, socket) {
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
function resolveConnectionByNick(connections, nick) {
  for (var c = 0; c < connections.length; c++)
    if (connections[c].nick == nick)
          return c;
  return -1;
}

function formatMessage(nick, message) {
  return bold(nick) + bold("&gt;") + " " + message;
}

const net = require('net');

function ChatServer () {
  var ChatServer = {};
  ChatServer.server = net.createServer();
  ChatServer.connections = [];
  ChatServer.log = [];
  ChatServer.motd = () => { return "Welcome to the Chat Server! Happy chatting..." };
  var eventHandlers = {};
  var anonCursor = 1;
  var trigger = function trigger (event, callback, data) {
    //log all events
    if (eventHandlers[event] && eventHandlers[event].length)
      for (var h = 0; h < eventHandlers[event].length; h++)
        eventHandlers[event][h](data);
    if (callback) callback(data);
  }
  ChatServer.on = function on (event, eventHandler) {
    if (ChatServer.server && (event == 'close' ||
        event == 'connection' ||
        event == 'error' ||
        event == 'listening'))
        ChatServer.server.on(event, eventHandler);
    if (event == 'server-started' ||
        event == 'server-stopped' ||
        event == 'server-send-all' ||
        event == 'server-send-client' ||
        event == 'server-client-connected' ||
        event == 'server-chat-received' ||
        event == 'server-client-renamed' ||
        event == 'server-client-disconnected' ||
        event == 'log') {
          if (!(eventHandlers[event] && eventHandlers[event].length))
            eventHandlers[event] = [];
          eventHandlers[event].push(eventHandler);
    }
    return ChatServer;
  }
  ChatServer.on('log', (event) => {
    console.log('[' + event.event + ']', event.message);
  })
  ChatServer.start = function (options, callback) {
    ChatServer.server.listen(options, () => {
      var address = ChatServer.server.address();
      trigger('log', null, { event: 'server-started', message: "Server started with " + address.family + " on interface " + address.address + " listening on port " + address.port + "." });
      trigger('server-started', callback, address);
      //handle motd and user online notification
      ChatServer.on('server-client-connected', function (connection) {
        var m = ChatServer.motd();
        if (ChatServer.motd()) {
          ChatServer.sendToUser(connection.nick, formatMessage("SYSTEM", m));
          ChatServer.sendToUser(connection.nick, formatMessage("SYSTEM", "Your nickname is " + connection.nick + '.'));
          ChatServer.sendToAll(formatMessage("SYSTEM", "User " + connection.nick + " is online."));
        }
      });
      //handle user offline notification
      ChatServer.on('server-client-disconnected', function (result) {
        ChatServer.sendToAll(formatMessage("SYSTEM", result.message));
      });
      //handle /nick, /who, and chats on the server
      ChatServer.on('server-chat-received', function (data) {
        if (data.message.trim().toLowerCase().indexOf('/nick ') == 0) {
          var oldNick = data.nick;
          var newNick = data.message.trim().substring(6).trim();
          for (var c in ChatServer.connections) {
            if (ChatServer.connections[c].nick == oldNick) {
              if (resolveConnectionByNick(ChatServer.connections, newNick) == -1) {
                ChatServer.connections[c].nick = newNick;
                trigger('log', null, { event: 'server-client-renamed', message: "User " + oldNick + " = &gt; " + newNick });
                trigger('server-client-renamed', null, { oldNick: oldNick, nick: newNick});
                ChatServer.sendToAll(formatMessage(oldNick, data.message));
                ChatServer.sendToUser(newNick, formatMessage('SYSTEM', "Your nickname is " + newNick + '.'));
                ChatServer.sendToAll(formatMessage('SYSTEM', "User " + oldNick + " is now known as " + newNick + "."));
              }
              else {
                ChatServer.sendToUser(oldNick, formatMessage('SYSTEM', "Nickname " + newNick + ' is taken.'));
              }
            }
          }
        }
        else if (data.message.trim().toLowerCase() == '/who') {
          ChatServer.sendToUser(data.nick, formatMessage(data.nick, data.message));
          ChatServer.sendToUser(data.nick, formatMessage("SYSTEM", "Online users:"));
          for (var c in ChatServer.connections) {
            ChatServer.sendToUser(data.nick, formatMessage("SYSTEM", bold(ChatServer.connections[c].nick)));
          }
          ChatServer.sendToUser(data.nick, formatMessage('SYSTEM', "Your nickname is " + data.nick + '.'));
        }
        else {
          ChatServer.sendToAll(formatMessage(data.nick, data.message));
        }
      });
      // handle chat client connection, then trigger server-client-connected
      ChatServer.on('connection', function (socket) {
        var connection = {
          socket: socket,
          nick: 'Anonymous' + (anonCursor++),
        };
        ChatServer.connections.push(connection);
        trigger('server-client-connected', null, connection);

        //handle chat client chat
        socket.on('data', (data) => {
          data = data.toString();
          var user = ChatServer.connections[resolveConnectionBySocket(ChatServer.connections, socket)];
          trigger('log', null, { event: 'server-chat-received', message: formatMessage(user.nick, data)});
          trigger('server-chat-received', null, { nick: user.nick, message: data });
        });

        //handle chat client close
        socket.on('close', (had_error) => {
          c = resolveConnectionBySocket(ChatServer.connections, socket);
          if (c != -1) {
            var connection = ChatServer.connections[c];
            ChatServer.connections.splice(c, 1);
            trigger('log', null, { event: 'server-client-disconnected', message: "User " + connection.nick + " has left."});
            trigger('server-client-disconnected', null, { nick: connection.nick, connection: connection, message: "User " + connection.nick + " has left." });
          }
        });
      });
    });
  };
  ChatServer.stop = function (options, callback) {
    server.close(options, () => {
      server.connections = [];
      server.backlog = "";
      anonCursor = 0;
      var address = ChatServer.server.address();
      trigger('log', null, { event: 'server-stopped', message: "Server stopped with " + address.family + " on interface " + address.address + " listening on port " + address.port + "." });
      trigger('server-stopped', callback, address);
    });
  };
  ChatServer.sendToAll = function (chat, callback) {
    console.log(chat);
    for (var c = 0; c < ChatServer.connections.length; c++) {
      try {
        ChatServer.connections[c].socket.write(chat+br);
      } catch (e) {}
    }
    trigger('log', null, { event: 'server-send-all', message: chat });
    trigger('server-send-all', callback, ChatServer.server);
  };
  ChatServer.sendToUser = function (recipient, chat, callback) {
    for (var c = 0; c < ChatServer.connections.length; c++) {
      if (ChatServer.connections[c].nick == recipient) {
        try {
          ChatServer.connections[c].socket.write(chat+br);
        } catch (e) {}
        trigger('log', null, { event: 'server-send-user', message: bold('@') + bold(recipient) + ' ' + chat });
        trigger('server-send-user', callback, chat);
      }
    }
  };
  return ChatServer;
}

module.exports = ChatServer;
