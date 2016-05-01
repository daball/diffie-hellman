//setup chat server
var ChatServer = require('../chat/ChatServer');

//setup HTTP server
var express = require('express');
var app = express();

app.use(express.static('public'));

var http = require('http').createServer(app);
var io = require('socket.io')(http);
var controller = require('./controller');
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

http.listen(process.env.PORT||8080);

//setup chat server callbacks HTTP responder
ChatServer.on('log', function (loggedEvent) {
  var event = loggedEvent.event;
  var data = loggedEvent.message;
  // if (data.message)
  //   io.sockets.emit('log', '['+event+'] ' + data.nick + '> ' + data.message);
  // else if (data.nick && data.socket) {
  //   var address = data.socket.remoteAddress();
  //   io.sockets.emit('log', '['+event+'] ' + data.nick + ' connected via ' + address.family + ' from host ' + address.host + ' on port ' + address.port + '.');
  // }
  // else
    io.sockets.emit('log', '['+event+'] ' + data);
});
