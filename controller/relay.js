function bold(html) { return "<b>"+html+"</b>"; }
function underline(html) { return "<u>"+html+"</u>"; }
const br = '<br />';

var net = require('net');
var relay = require('../chat/ChatRelay.js')();

// setup chat relay callbacks HTTP responder
relay.on('log', function (loggedEvent) {
  var event = loggedEvent.event;
  var data = loggedEvent.message;
  controller.io.sockets.emit('log', '['+event+'] ' + data);
});

var controller = module.exports = {
  'relay': relay,
  'io': { sockets: { emit: () => {} }},
  'relay': {
    'validate': function (cmd) {
      cmd = cmd.trim().toLowerCase();
      return (cmd.indexOf('/relay') == 0);
    },
    'run': function (cmd, socket) {
      var cmd = cmd.trim().split(' ');
      var listenPort = cmd.length > 1 ? cmd[1] : '8005';
      var clientHost = cmd.length > 2 ? cmd[2] : 'localhost';
      var clientPort = cmd.length > 3 ? cmd[3] : '8000';
      relay.start(listenPort, clientHost, clientPort);
      relay.on('relay-secure-chat-compromised', (chat) => {
        controller.io.emit('attack', "Decrypted secret message from " + chat.sender + " to " + chat.recipient + ": " + chat.message);
      });
    }
  },
  'append': {
    'validate': function (cmd) {
      cmd = cmd.trim().toLowerCase();
      return (cmd.indexOf('/append ') == 0);
    },
    'run': function (cmd, socket) {
      relay.appendMessages = cmd.substring(8);
      controller.io.sockets.emit('log', 'Appending all server output with text.');
    }
  },  'help': {
    'validate': (cmd) => {
      cmd = cmd.trim().toLowerCase();
      return (cmd == '/?' ||
              cmd == '/help');
    },
    'run': (cmd, socket) => {
      var output = '' +
        bold('Diffie-Hellman Chat Relay Server') + br +
        bold('(c) David Allen Ball 2016.') + br +
        'LICENSE: BSD' + br +
        br +
        underline('Server Maintenance Command List') + br +
        br +
        bold('/help') + ' - This help menu.' + br +
        bold('/relay ') + ' [listenPort] [serverHost] [serverPort] - Starts relaying incoming chat sessions to a chat server.' + br
        bold('/append ') + ' [str] - Appends all outgoing text with a text string.' + br
        br +
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
