function bold(html) { return "<b>"+html+"</b>"; }
function underline(html) { return "<u>"+html+"</u>"; }
const br = '<br />';

function formatMessage(nick, message) {
  return bold(nick) + bold("&gt;") + " " + message;
}

//echo() is reused for most client events,
//echoes the contents out to all connected browsers
var echo = (eventType) => {
  return (result) => {
    controller.io.sockets.emit('attack', formatMessage('CHAT_INCOMING...>'+eventType+(result.message?result.message:'')));
  }
}
var controller = module.exports = {
  client: undefined,
  relay: undefined,
  'io': { sockets: { emit: () => {} }},
  init: (client, relay, io) => {
    controller.client = client;
    controller.relay = relay;
    controller.io = io;
    client.client
      .on('client-connecting', echo('<...client-connecting'))
      .on('client-connected', echo('<...client-connected'))
      .on('client-error', echo('<...client-error'))
      .on('client-connection-error', echo('<...client-connection-error'))
      .on('client-connection-timeout', echo('<...client-connection-timeout'))
      .on('client-message-received', echo('<...client-message-received'));
  },
  'connect': {
    'validate': function (cmd) {
      return controller.client.connect.validate(attack);
    },
    'run': function (cmd, socket) {
      return controller.client.connect.run(attack, socket);
    }
  },
  'relay': {
    'validate': function (cmd) {
      return controller.relay.relay.validate(attack);
    },
    'run': function (cmd, socket) {
      return controller.relay.relay.run(attack, socket);
    }
  },
  //wildcard, guaranteed last route
  '_default': {
    validate: (attack, socket) => {
      return true;
    },
    run: (attack, socket) => {
      controller.io.sockets.emit('attack', "I'm sorry. My responses are limited. You must ask the right questions.");
    },
  },
}
