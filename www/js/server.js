function bold(html) { return "<b>" + html + "</b>"; }
var br = "<br />";
function formatMessage(nick, message) {
  return bold(nick) + bold("&gt;") + " " + message;
}

//connects web browser chat server on the server
var server;

function connect() {
  //display connecting...
  $('#log').html($('#log').html() + br + formatMessage('BROWSER', "Connecting to chat server..."));
  server = io.connect();
}

//accepts input
function sendServerCmd(cmd) {
  if (cmd)
    server.emit('cmd', cmd);
}

function receiveServerCmd(log) {
  console.log(log);
  $('#log').html($('#log').html() + br + log);
  $('html,body').animate({scrollTop: document.body.scrollHeight},"fast");
}

//send button on click
$('#send-cmd').click(function () {
  sendServerCmd($('#cmd').val());
  $('#cmd').val('');
});


//listen for enter
$('#cmd').keydown(function(evt) {
  //console.log(evt);
    if (event.keyCode == 13) {
        $('#send-cmd').click();
        return false;
     }
});
connect();
server.on("connect", function () {
    console.log("Connected!");
    $('#log').html($('#log').html() + br + formatMessage('BROWSER', "Connected to chat server..."));
    server.on("log", receiveServerCmd);
});
