function bold(html) { return "<b>" + html + "</b>"; }
var br = "<br />";
function formatMessage(nick, message) {
  return bold(nick) + bold("&gt;") + " " + message;
}

/* Navigation */
function setView(view) {
  if (view == 'attack') {
    $('html').addClass('attack');
    $('html').removeClass('client');
    $('html').removeClass('server');
    $('#log').css('display', 'none');
    $('#log-ui').css('display', 'none');
    $('#chat').css('display', 'none');
    $('#chat-ui').css('display', 'none');
    $('#attack').css('display', 'block');
    $('#attack-ui').css('display', 'block');
    $('#nav-client').parent().removeClass('active');
    $('#nav-server').parent().removeClass('active');
    $('#nav-attack').parent().addClass('active');
  }
  else if (view == 'client') {
    $('html').addClass('client');
    $('html').removeClass('attack');
    $('html').removeClass('server');
    $('#attack').css('display', 'none');
    $('#attack-ui').css('display', 'none');
    $('#log').css('display', 'none');
    $('#log-ui').css('display', 'none');
    $('#chat').css('display', 'block');
    $('#chat-ui').css('display', 'block');
    $('#nav-attack').parent().removeClass('active');
    $('#nav-server').parent().removeClass('active');
    $('#nav-client').parent().addClass('active');
  }
  else if (view == 'server') {
    $('html').addClass('server');
    $('html').removeClass('attack');
    $('html').removeClass('client');
    $('#attack').css('display', 'none');
    $('#attack-ui').css('display', 'none');
    $('#chat').css('display', 'none');
    $('#chat-ui').css('display', 'none');
    $('#log').css('display', 'block');
    $('#log-ui').css('display', 'block');
    $('#nav-attack').parent().removeClass('active');
    $('#nav-client').parent().removeClass('active');
    $('#nav-server').parent().addClass('active');
  }
}
$('#nav-attack').click(function () { setView('attack'); });
$('#nav-client').click(function () { setView('client'); });
$('#nav-server').click(function () { setView('server'); });
$(setView('attack'));

/* SOCKET.IO */

//connects web browser chat server on the server
var attack;

function connect() {
  //display connecting...
  $('#attack').html($('#attack').html() + br + formatMessage('BROWSER', "Connecting to attack server..."));
  attack = io.connect();
}

function sendAttack(msg) {
  if (msg)
    attack.emit('attack', msg);
}

function receiveAttack(msg) {
  console.log(msg);
  $('#attack').html($('#attack').html() + br + msg);
  $('html,body').animate({scrollTop: document.body.scrollHeight},"fast");
}

$('#send-attack').click(function () {
  sendAttack($('#atcmd').val());
  $('#atcmd').val('');
});

//listen for enter
$('#atcmd').keydown(function(evt) {
  //console.log(evt);
    if (event.keyCode == 13) {
        $('#send-attack').click();
        return false;
     }
});
connect();
attack.on("connect", function () {
    console.log("Connected!");
    $('#attack').html($('#attack').html() + br + formatMessage('BROWSER', "Connected to attack server..."));
    attack.on("attack", receiveAttack);
});
