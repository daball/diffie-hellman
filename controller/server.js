function bold(html) { return "<b>"+html+"</b>"; }
function underline(html) { return "<u>"+html+"</u>"; }
const br = '<br />';

var net = require('net');
var server = require('../chat/ChatServer.js')();

// setup chat server callbacks HTTP responder
server.on('log', function (loggedEvent) {
  var event = loggedEvent.event;
  var data = loggedEvent.message;
  controller.io.sockets.emit('log', '['+event+'] ' + data);
});

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
        bold('(c) David Allen Ball 2016.') + br +
        'LICENSE: BSD' + br +
        br +
        underline('Server Maintenance Command List') + br +
        br +
        bold('/help') + ' - This help menu.' + br +
        bold('/listen') + ' [port] - Starts listening on a TCP port.' + br +
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
