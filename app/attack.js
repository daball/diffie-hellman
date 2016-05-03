function bold(html) { return "<b>"+html+"</b>"; }
function underline(html) { return "<u>"+html+"</u>"; }
const br = '<br />';

function formatMessage(nick, message) {
  return bold(nick) + bold("&gt;") + " " + message;
}

const clc = require('cli-color');

function AttackApp() {
  console.log(clc.bold('Diffie-Hellman MITM Relay Attack Client/Server'));
  console.log(clc.bold('(c) David Allen Ball 2016.'));
  console.log('LICENSE: BSD');
  console.log();

  var express = require('express');
  var app = express();

  app.use(function (req, res, next) {
    if (req.url == '/') {
      req.url = '/attack/index.html';
    }
    next();
  });

  var path = require('path');
  app.use(express.static(path.join(__dirname, '../www')));

  var server = require('http').createServer(app);
  var os = require('os');
  var io = require('socket.io')(server);
  var controllers = {
    attack: require('../controller/attack'),
    client: require('../controller/client'),
    relay: require('../controller/relay'),
  };
  controllers.client.io = io;
  controllers.relay.io = io;
  controllers.attack.init(controllers.client, controllers.relay, io);
  io.on('connection', function (socket){
    console.log('Web browser connected on', socket.id);
    if (controllers.client.client.client)
      controllers.client.client.send('/who');
    //chat client routing
    socket.on("chat", function (chat) {
      var foundRoute = false;
      for (var c in controllers.client) {
        if (c &&
            c != '_default' &&
            controllers.client[c] &&
            controllers.client[c].validate &&
            controllers.client[c].validate(chat))
            {
              foundRoute = true;
              io.sockets.emit('chat', formatMessage(controllers.client.client.nick?controllers.client.client.nick:'USER', chat));
              controllers.client[c].run(chat, socket);
            }
      }
      if (!foundRoute && controllers.client._default)
        controllers.client._default.run(chat, socket);
    });
    //chat relay routing
    socket.on("cmd", function (cmd) {
      io.sockets.emit('log', '>'+cmd);
      var foundRoute = false;
      for (var c in controllers.relay) {
        if (c &&
            c != "_default" &&
            controllers.relay[c] &&
            controllers.relay[c].validate &&
            controllers.relay[c].validate(cmd))
            {
              controllers.relay[c].run(cmd, socket);
              foundRoute = true;
              break;
            }
      }
      if (!foundRoute && controllers.relay._default)
        controllers.relay._default.run(cmd, socket);
    });
    //attack routing
    socket.on("attack", function (attack) {
      var foundRoute = false;
      io.sockets.emit('attack', formatMessage('URAWESOME!', attack));
      for (var c in controllers.attack) {
        if (c &&
            c != '_default' &&
            controllers.attack[c] &&
            controllers.attack[c].validate &&
            controllers.attack[c].validate(attack))
            {
              foundRoute = true;
              controllers.attack[c].run(attack, socket);
            }
      }
      if (!foundRoute && controllers.attack._default)
        controllers.attack._default.run(attack, socket);
    });
    socket.on('disconnect', function(){
      console.log('Web browser disconnected on', socket.id);
    });
  });
  var AttackApp = {
    express: express,
    app: app,
    server: server,
    io: io,
    controllers: controllers,
    start: (port) => {
      port = port||8085;
      server.listen(port);
      console.log('[UP]      MITM Relay Attack Client/Server User Interface Web Server is running.');
      console.log('[CONNECT] Navigate your web browser to access application UI:');
      var ifs = os.networkInterfaces();
      for (var i in ifs) {
        for (var f = 0; f < ifs[i].length; f++) {
          console.log('[URL]       ' + i + ' > ' + clc.underline('http://' + (ifs[i][f].family=='IPv6'?'['+ifs[i][f].address+']':ifs[i][f].address) + ':' + port + '/'));
        }
      }
      return server;
    },
    stop: () => {
      server.stop();
      return server;
    },
  };
  return AttackApp;
}

module.exports = AttackApp;
