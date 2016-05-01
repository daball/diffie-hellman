const clc = require('cli-color');

console.log(clc.bold('Diffie Hellman Chat Demonstration'));
console.log(clc.bold('(c) David Allen Ball 2016.'));
console.log('LICENSE: BSD');
console.log();

var express = require('express');
var app = express();

app.use(function (req, res, next) {
  if (req.url == '/')
    req.url = '/demo/index.html';
  next();
});

var path = require('path');
app.use(express.static(path.join(__dirname, '../www')));

function bold(html) { return "<b>"+html+"</b>"; }
function underline(html) { return "<u>"+html+"</u>"; }
const br = '<br />';

function formatMessage(nick, message) {
  return bold(nick) + bold("&gt;") + " " + message;
}

var server = require('http').createServer(app);
var os = require('os');
var io = require('socket.io')(server);
var controller = require('../controller/demo');
var dh = require('../crypto/diffie-hellman');
var dhA = dh();
var dhB = dh();
controller.io = io;
io.on('connection', function (socket){
  console.log('Web browser connected on', socket.id);
  socket.on('dh-calc', function (vars) {
    var calc = {};
    if (vars.a && dhA.getPrivateKey().notEquals(vars.a))
      dhA.setPrivateKey(vars.a);
    if (vars.b && dhB.getPrivateKey().notEquals(vars.b))
      dhB.setPrivateKey(vars.b);
    if (vars.p && dhA.getModulus().notEquals(vars.p))
      dhA.setModulus(vars.p);
    if (vars.p && dhB.getModulus().notEquals(vars.p))
      dhB.setModulus(vars.p);
    if (vars.q && dhA.getBase().notEquals(vars.q))
      dhA.setBase(vars.q);
    if (vars.q && dhB.getBase().notEquals(vars.q))
      dhB.setBase(vars.q);
    if (vars.a && vars.p && vars.q) {
      calc.A = dhA.getPublicKey().toString();
      if (dhB.getRemotePublicKey().notEquals(dhA.getPublicKey()))
        dhB.setRemotePublicKey(dhA.getPublicKey());
    }
    if (vars.b && vars.p && vars.q) {
      calc.B = dhB.getPublicKey().toString();
      if (dhA.getRemotePublicKey().notEquals(dhB.getPublicKey()))
        dhA.setRemotePublicKey(dhB.getPublicKey());
    }
    if (calc.A && calc.B && dhA.getSessionKey().equals(dhB.getSessionKey()))
      calc.s = dhA.getSessionKey().toString();
    socket.emit('dh-calc', calc);
  });
  socket.on("demo", function (chat) {
    var foundRoute = false;
    for (var c in controller) {
      if (c &&
          c != '_default' &&
          controller[c] &&
          controller[c].validate &&
          controller[c].validate(chat))
          {
            foundRoute = true;
            io.sockets.emit('demo', formatMessage(controller.client.nick?controller.client.nick:'USER', chat));
            controller[c].run(chat, socket);
          }
    }
    if (!foundRoute && controller._default)
      controller._default.run(chat, socket);
  });
  socket.on('disconnect', function(){
    console.log('Web browser disconnected on', socket.id);
  });
});

module.exports = {
  express: express,
  app: app,
  server: server,
  io: io,
  controller: controller,
  start: (port) => {
    port = port||3000;
    server.listen(port);
    console.log('[UP]      Chat Demonstration User Interface Web Server is running.');
    console.log('[CONNECT] Navigate your web browser to access application UI:');
    var ifs = os.networkInterfaces();
    for (var i in ifs) {
      for (var f = 0; f < ifs[i].length; f++) {
        console.log('[URL]       ' + i + ' > ' + clc.underline('http://' + ifs[i][f].address + ':' + port + '/'));
      }
    }
    return server;
  },
  stop: () => {
    server.stop();
    return server;
  },
};
