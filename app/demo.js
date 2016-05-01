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
controller.io = io;
io.on('connection', function (socket){
  console.log('Web browser connected on', socket.id);
  if (controller.client.client)
    controller.client.send('/who');
  socket.on("chat", function (chat) {
    var foundRoute = false;
    for (var c in controller) {
      if (c &&
          c != '_default' &&
          controller[c] &&
          controller[c].validate &&
          controller[c].validate(chat))
          {
            foundRoute = true;
            io.sockets.emit('chat', formatMessage(controller.client.nick?controller.client.nick:'USER', chat));
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