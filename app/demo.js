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

var serveIndex = require('serve-index')
var path = require('path');
var fs = require('fs');
app.use(express.static(path.join(__dirname, '../www')));
if (!fs.existsSync(path.join(__dirname, '../captures')))
  fs.mkdirSync(path.join(__dirname, '../captures'))
app.use('/captures', serveIndex(path.join(__dirname, '../captures')));
app.use('/captures', express.static(path.join(__dirname, '../captures')));

function bold(html) { return "<b>"+html+"</b>"; }
function underline(html) { return "<u>"+html+"</u>"; }
const br = '<br />';

function formatMessage(nick, message) {
  return bold(nick) + bold("&gt;") + " " + message;
}

var server = require('http').createServer(app);
var os = require('os');
var io = require('socket.io')(server);
var controller = require('../controller/demo')(io);
controller.io = io;
io.on('connection', function (socket){
  console.log('Web browser connected on', socket.id);
  socket.on('dh-calc', function (vars) {
    socket.emit('dh-calc', controller.dhCalc(socket, vars));
  });
  var servers;
  socket.on('svc-start', function (svc) {
    if (svc.server) {
      controller.startServer(socket, svc.server.port);
    }
    if (svc.pcap) {
      controller.startPcap(socket, svc.pcap.port);
    }
    if (svc.client) {
      controller.startClient(socket, svc.client.port);
    }
    if (svc.attack) {
      controller.startAttack(socket, svc.relay.port);
    }
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
