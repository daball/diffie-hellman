function bold(html) { return "<b>"+html+"</b>"; }
function underline(html) { return "<u>"+html+"</u>"; }
const br = '<br />';

var net = require('net');
var server = require('../chat/ChatServer.js');

var controller = module.exports = {
  'server': server,
  'io': { sockets: { emit: () => {} }},
  'listen': {
    'validate': function (cmd) {
      cmd = cmd.trim().toLowerCase();
      return (cmd.indexOf('/listen ') == 0);
    },
    'run': function (cmd, socket) {
      var cmd = cmd.trim().split(' ');
      var port = cmd.length > 1 ? cmd[1] : '8000';
      server.start(port);
      // socket.emit({ message: 'server.server' });
      // if (server.listening)
      //   server.close();
      // var client = net.connect(port, host);
      // socket.emit('chat', {
      //   message: 'Connecting to host ' + host + ':' + port + '.',
      // });
      // client.on('connect', () => {
      //   socket.emit('chat', {
      //     message: 'Connected to host ' + host + ':' + port + '.',
      //   });
      // });
      // client.on('data', (error) => {
      //   data = JSON.parse(data.toString());
      //   socket.emit('chat', {
      //     message: "There was an error connecting to the host: " + error.message,
      //   });
      // });
      // client.on('data', (data) => {
      //   data = JSON.parse(data.toString());
      //   socket.emit('chat', {
      //     message: bold(data.nick||"SYSTEM") + bold(">") + " " + data.message
      //   });
      // });
      // client.on('end', () => {
      //   socket.emit('chat', {
      //     message: 'Disconnected from host ' + host + ':' + port + '.'
      //   });
      // });
    }
  },
  'help': {
    'validate': (cmd) => {
      cmd = cmd.trim().toLowerCase();
      return (cmd == '/?' ||
              cmd == '/help');
    },
    'run': (cmd, socket) => {
      var output = '' +
        bold('Diffie-Hellman Chat Server') + br +
        bold('(c) David Ball 2016.') + br +

        'LICENSE: BSD' + br +
        '' + br +
        underline('Client Command List') + br +
        '' + br +
        bold('/help') + ' - This help menu.' + br +
        bold('/repl') + ' - Opens a REPL interpreter.' + br +
        bold('/connect') + ' [host] [port] - Connects to a chat server.' + br +
        bold('/disconnect') + ' - Disconnects from the chat server.' + br +
        bold('/exit') + ' - Closes the chat client.' + br +

        '' + br +
        underline('Client Command List (Diffie-Hellman Session Exchange)') + br +
        'These will negotiate a Diffie-Hellman session between two parties.' + br +
        'Party1 should send a /dh-syn, optionally specifying a prime.' + br +
        'Party2 should send a /dh-ack, optionally specifying a prime.' + br +
        'Each party should exchange their public key with /dh-pub.' + br +
        'Once both parties exchange public keys, the session key can be used to encrypt messages.' + br +
        '' + br +
        bold('/dh-syn') + ' [nick] [prime-q] - Initiates the DH exchange.' + br +
        bold('/dh-ack') + ' [nick] [prime-p] - Responds to the DH exchange.' + br +
        bold('/dh-pub') + ' [nick] - Shares public key.' + br +

        '' + br +
        underline('Client Command List (Peer-to-Peer Cryptographic Messaging)') + br +
        '' + br +
        bold('/cc-send') + ' [nick] [message] - Sends Caesar cipher-encrypted data.' + br +
        bold('/aes-send') + ' [nick] [message] - Sends AES256-encrypted data.' + br +

        '' + br +
        underline('Server Command List') + br +
        '' + br +
        bold('/nick') + ' [nick] - Sets your nickname on the server.' + br +
        bold('/who') + ' - Shows a list of all users on the server.' + br +
      '';
      controller.io.sockets.emit('log', output);
    },
  },
  //wildcard, guaranteed last route
  '_default': {
    validate: (chat, socket) => {
      return true;
    },
    run: (chat, socket) => {
      controller.io.sockets.emit('log', "Unrecognized command.");
    },
  },
};
