var controller = module.exports = {
  'clients': [],
  'servers': [],
  'relays': [],
  'io': { sockets: { emit: () => {} }},
  'start-client': {
    'validate': function (chat, socket) {
    },
    'run': function (chat, socket) {
    }
  },
  'start-server': {
    'validate': (chat, socket) => {
    },
    'run': (chat, socket) => {
    },
  },
  //wildcard, guaranteed last route
  '_default': {
    validate: (chat, socket) => {
    },
    run: (chat, socket) => {
    },
  },
};
