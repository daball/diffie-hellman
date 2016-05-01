var express = require('express');
var app = express();

app.use(express.static('public'));

function bold(html) { return "<b>"+html+"</b>"; }
function underline(html) { return "<u>"+html+"</u>"; }
const br = '<br />';

function formatMessage(nick, message) {
  return bold(nick) + bold("&gt;") + " " + message;
}

var server = require('http').createServer(app);
var io = require('socket.io')(server);
var controller = require('./controller');
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

server.listen(process.env.PORT||8081);
