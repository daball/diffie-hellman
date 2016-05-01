//connects web browser chat client on the server
var socket;

function sendDHCalc() {
  var vars = {
    p: $('#dh-calc-p').val(),
    q: $('#dh-calc-q').val(),
    a: $('#dh-calc-a').val(),
    b: $('#dh-calc-b').val(),
  };
  console.log('sendDHCalc hit')
  if ((vars.p && vars.q && vars.a) ||
      (vars.p && vars.q && vars.b)) {
    socket.emit('dh-calc', vars);
  }
}

function receiveDHCalc(calc) {
  if (calc.A) $('#dh-calc-A').val(calc.A);
  else $('#dh-calc-A').val('');
  if (calc.B) $('#dh-calc-B').val(calc.B);
  else $('#dh-calc-B').val('');
  if (calc.s) $('#dh-calc-s').val(calc.s);
  else $('#dh-calc-s').val('');
}

$('#dh-calc-p').keyup(sendDHCalc);
$('#dh-calc-q').keyup(sendDHCalc);
$('#dh-calc-a').keyup(sendDHCalc);
$('#dh-calc-b').keyup(sendDHCalc);

//send button on click
$('#send').click(function () {
  send($('#message').val());
  $('#message').val('');
});

function connect() {
  $.notify("Connecting to demo server...", "info");
  socket = io.connect();
}

//listen for enter
$('#message').keydown(function(evt) {
  //console.log(evt);
    if (event.keyCode == 13) {
        $('#send').click();
        return false;
     }
});
connect();
socket.on("connect", function () {
    $.notify("Connected to demo server...", "success");
    socket.on("dh-calc", receiveDHCalc);
});
