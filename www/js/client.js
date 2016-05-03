function bold(html) { return "<b>" + html + "</b>"; }
var br = "<br />";
function formatMessage(nick, message) {
  return bold(nick) + bold("&gt;") + " " + message;
}

//connects web browser chat client on the server
var client;
var nick = '';


function setNick(newNick) {
  nick = newNick;
  $('#nick').text(nick + ' - ');
  document.title = nick + ' - Diffie-Hellman Chat Client';
}

//accepts input
function sendChat(msg) {
  if (msg)
    client.emit('chat', msg);
}

function receiveChat(chat) {
  var search = /^<b>SYSTEM<\/b><b>&gt;<\/b> Your nickname is (.*)\.<br \/>/;
  var matches = chat.match(search);
  if (matches) {
    var newNick = matches[1];
    setNick(newNick);
  }
  if ($('#chat').html().trim().lastIndexOf('<br') < $('#chat').html().trim().length-4) {
    chat = br + chat;
  }
  $('#chat').html($('#chat').html() + chat);
  $('html,body').animate({scrollTop: document.body.scrollHeight},"fast");
}

//send button on click
$('#send-chat').click(function () {
  sendChat($('#message').val());
  $('#message').val('');
});

function connect() {
  //display connecting...
  $('#chat').html($('#chat').html() + br + formatMessage('BROWSER', "Connecting to chat client..."));
  client = io.connect();
}

//listen for enter
$('#message').keydown(function(evt) {
  //console.log(evt);
    if (event.keyCode == 13) {
        $('#send-chat').click();
        return false;
     }
});
connect();
client.on("connect", function () {
    console.log("Connected!");
    $('#chat').html($('#chat').html() + br + formatMessage('BROWSER', "Connected to chat client..."));
    client.on("chat", receiveChat);
});
