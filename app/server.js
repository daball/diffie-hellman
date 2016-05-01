const clc = require('cli-color');

console.log(clc.bold('Diffie Hellman Chat Server'));
console.log(clc.bold('(c) David Allen Ball 2016.'));
console.log('LICENSE: BSD');
console.log();

//setup HTTP server
var express = require('express');
var app = express();

app.use(function (req, res, next) {
  if (req.url == '/')
    req.url = '/server/index.html';
  next();
});

var path = require('path');
app.use(express.static(path.join(__dirname, '../www')));

var server = require('http').createServer(app);
var os = require('os');
var io = require('socket.io')(server);
var controller = require('../controller/server');
controller.io = io;
io.on('connection', function (socket){
  console.log('Web browser connected with socket.id =', socket.id);
  socket.on("cmd", function (cmd) {
    io.sockets.emit('log', '>'+cmd);
    var foundRoute = false;
    for (var c in controller) {
      if (c &&
          c != "_default" &&
          controller[c] &&
          controller[c].validate &&
          controller[c].validate(cmd))
          {
            controller[c].run(cmd, socket);
            foundRoute = true;
            break;
          }
    }
    if (!foundRoute && controller._default)
      controller._default.run(cmd, socket);
  });
  socket.on('disconnect', function(){
    console.log('Web browser disconnected with socket.id = ', socket.id);
  });
});

module.exports = {
  express: express,
  app: app,
  server: server,
  io: io,
  controller: controller,
  start: (port) => {
    port = port||8080;
    server.listen(port);
    console.log('[UP]      Chat Server User Interface Web Server is running.');
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
