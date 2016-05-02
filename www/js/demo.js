//connects web browser chat client on the server
var socket;

var br = "<br />";

/* Diffie-Hellman calculator */

function sendDHCalc() {
  var vars = {
    p: parseInt($('#dh-calc-p').val()),
    q: parseInt($('#dh-calc-q').val()),
    a: parseInt($('#dh-calc-a').val()),
    b: parseInt($('#dh-calc-b').val()),
  };
  console.log('sendDHCalc hit')
  if ((vars.p && vars.q && vars.a) ||
      (vars.p && vars.q && vars.b)) {
    socket.emit('dh-calc', vars);
  }
}

function receiveDHCalc(calc) {
  if (calc.A) {
    if (calc.A != $('#dh-calc-A').val()) {
      $('#dh-calc-A').val(calc.A);
      $("#dh-calc-A").notify("Calculated A.", { position: "bottom", className: 'success' });
    }
  }
  else $('#dh-calc-A').val('');
  if (calc.B) {
    if (calc.B != $('#dh-calc-B').val()) {
      $('#dh-calc-B').val(calc.B);
      $("#dh-calc-B").notify("Calculated B.", { position: "bottom", className: 'success' });
    }
  }
  else $('#dh-calc-B').val('');
  if (calc.s) {
    if (calc.s != $('#dh-calc-s').val()) {
      $('#dh-calc-s').val(calc.s);
      $("#dh-calc-s").notify("Calculated s.", { position: "bottom", className: 'success' });
    }
  }
  else $('#dh-calc-s').val('');
}

$('#dh-calc-p').keyup(sendDHCalc);
$('#dh-calc-q').keyup(sendDHCalc);
$('#dh-calc-a').keyup(sendDHCalc);
$('#dh-calc-b').keyup(sendDHCalc);

/* A-B Service Manager */

var svcEvts = {};
function receiveABServiceStat(evt) {
  var id = evt.type+':'+evt.port;
  if (!svcEvts[id])
    svcEvts[id] = '';
  svcEvts[id] += br + //'['+(evt.pipe?':'+evt.pipe:'')+'] '+
    (evt.data?evt.data:'') + (evt.exit?'The process exited with code ' +evt.exit+'.':'');
  updateABServiceStat();
}
function updateABServiceStat() {
  $('#ab-svc-stat').html(svcEvts[$('input[name=ab-rad]:checked').val()]);
}
$('input[name=ab-rad]').change(updateABServiceStat);

$('#ab-start-svc').click(function () {
  $($('#ab-start-svc').parent()).css('display', 'none');
  $('#ab-log').css('display', 'block');
  socket.emit('svc-start', { server: { port: 8080 } });
  socket.emit('svc-start', { pcap: { port: 8000 } });
  socket.emit('svc-start', { client: { port: 8081 } });
  socket.emit('svc-start', { client: { port: 8082 } });
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
    socket.on("svc-stat", receiveABServiceStat);
});
