function bold(html) { return "<b>" + html + "</b>"; }
var br = "<br />";

//connects web browser chat server on the server
var socket;

function connect() {
  //display connecting...
  $('#log').html($('#log').html() + br + "Connecting to chat server...");
  socket = io.connect();
}

//accepts input
function send(cmd) {
  if (cmd)
    socket.emit('cmd', cmd);
}

function receive(log) {
  console.log(log);
  $('#log').html($('#log').html() + br + log);
  $('html,body').animate({scrollTop: document.body.scrollHeight},"fast");
}

//send button on click
$('#send').click(function () {
  send($('#cmd').val());
  $('#cmd').val('');
});


//listen for enter
$('#cmd').keydown(function(evt) {
  //console.log(evt);
    if (event.keyCode == 13) {
        $('#send').click();
        return false;
     }
});
connect();
socket.on("connect", function () {
    console.log("Connected!");
    $('#log').html($('#log').html() + br + "Connected to chat server...");
    socket.on("log", receive);
});
