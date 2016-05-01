function bold(html) { return "<b>"+html+"</b>"; }
function underline(html) { return "<u>"+html+"</u>"; }
const br = '<br />';

var client = require('../chat/ChatClient');

//echo() is reused for most client events,
//echoes the contents out to all connected browsers
var echo = (result) => {
  controller.io.sockets.emit('chat', result.message);
}

client
  .on('client-connected', echo)
  .on('client-connected', echo)
  .on('client-error', echo)
  .on('client-connection-error', echo)
  .on('client-connection-timeout', echo)
  .on('client-message-received', echo);

var controller = module.exports = {
  'client': client,
  'io': { sockets: { emit: () => {} }},
  'connect': {
    'validate': function (chat, socket) {
      var cmd = chat.trim().toLowerCase();
      return (cmd.indexOf('/connect ') == 0);
    },
    'run': function (chat, socket) {
      var cmd = chat.trim().split(' ');
      var host = cmd.length > 1 ? cmd[1] : 'localhost';
      var port = cmd.length > 2 ? cmd[2] : 8000;
      client.connect(host, port);
    }
  },
  'help': {
    'validate': (chat, socket) => {
      var cmd = chat.trim().toLowerCase();
      return (cmd == '/?' ||
              cmd == '/help');
    },
    'run': (chat, socket) => {
      var output = '' +
        bold('Diffie-Hellman Chat Client') + br +
        bold('(c) David Allen Ball 2016.') + br +
        'LICENSE: BSD' + br +
        br +
        underline('Client Command List') + br +
        br +
        bold('/help') + ' - This help menu.' + br +
        bold('/connect') + ' [host] [port] - Connects to a chat server.' + br +
        bold('/disconnect') + ' - Disconnects from the chat server.' + br +
        br +
        underline('Client Command List (Diffie-Hellman Session Exchange)') + br +
        'These will negotiate a Diffie-Hellman session between two parties.' + br +
        'Party1 should send a /dh-syn.' + br +
        'Party2 should send a /dh-ack.' + br +
        'Each party should exchange their public key with /dh-pub.' + br +
        'Once both parties exchange public keys, the session key can be used to encrypt messages.' + br +
        br +
        bold('/dh-syn') + ' [nick] - Initiates the DH exchange.' + br +
        bold('/dh-ack') + ' [nick] - Responds to the DH exchange.' + br +
        bold('/dh-pub') + ' [nick] - Shares public key.' + br +
        br +
        underline('Client Command List (Peer-to-Peer Cryptographic Messaging)') + br +
        br +
        bold('/cc-send') + ' [nick] [message] - Sends Caesar cipher-encrypted data.' + br +
        bold('/aes-send') + ' [nick] [message] - Sends AES256-encrypted data.' + br +
        br +
        underline('Server Command List') + br +
        br +
        bold('/nick') + ' [nick] - Sets your nickname on the server.' + br +
        bold('/who') + ' - Shows a list of all users on the server.' + br +
      '';
      controller.io.sockets.emit('chat', output);
    },
  },
  //wildcard, guaranteed last route
  '_default': {
    validate: (chat, socket) => {
      return true;
    },
    run: (chat, socket) => {
      client.send(chat);
    },
  },
};
