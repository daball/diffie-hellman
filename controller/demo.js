const path = require('path');
const spawn = require('child_process').spawn;
const dh = require('../crypto/diffie-hellman');
const Convert = require('ansi-to-html');
const a2h = new Convert('ansi-to-html');
var controller = function (io) {
  var me = {
    'clients': [],
    'servers': [],
    'pcaps': [],
    'attacks': [],
    'io': io,
    dhA: dh(),
    dhB: dh()
  };
  me.dhCalc = (socket, vars) => {
    var calc = {};
    if (vars.a && me.dhA.getPrivateKey().notEquals(vars.a))
      me.dhA.setPrivateKey(vars.a);
    if (vars.b && me.dhB.getPrivateKey().notEquals(vars.b))
      me.dhB.setPrivateKey(vars.b);
    if (vars.p && me.dhA.getModulus().notEquals(vars.p))
      me.dhA.setModulus(vars.p);
    if (vars.p && me.dhB.getModulus().notEquals(vars.p))
      me.dhB.setModulus(vars.p);
    if (vars.q && me.dhA.getBase().notEquals(vars.q))
      me.dhA.setBase(vars.q);
    if (vars.q && me.dhB.getBase().notEquals(vars.q))
      me.dhB.setBase(vars.q);
    if (vars.a && vars.p && vars.q) {
      calc.A = me.dhA.getPublicKey().toString();
      if (me.dhB.getRemotePublicKey().notEquals(me.dhA.getPublicKey()))
        me.dhB.setRemotePublicKey(me.dhA.getPublicKey());
    }
    if (vars.b && vars.p && vars.q) {
      calc.B = me.dhB.getPublicKey().toString();
      if (me.dhA.getRemotePublicKey().notEquals(me.dhB.getPublicKey()))
        me.dhA.setRemotePublicKey(me.dhB.getPublicKey());
    }
    if (calc.A && calc.B && me.dhA.getSessionKey().equals(me.dhB.getSessionKey()))
      calc.s = me.dhA.getSessionKey().toString();
    return calc;
  };
  var stdioReplay = (type, svc, port) => {
    svc.stdout.on('data', (data) => {
      me.io.sockets.emit('svc-stat', {
        type: type,
        port: port,
        pipe: 'stdout',
        data: a2h.toHtml(data.toString()),
      });
    });
    svc.stderr.on('data', (data) => {
      me.io.sockets.emit('svc-stat', {
        type: type,
        port: port,
        pipe: 'stderr',
        data: a2h.toHtml(data.toString()),
      });
    });
    svc.stdout.on('close', (code) => {
      me.io.sockets.emit('svc-stat', {
        type: type,
        port: port,
        exit: code,
      });
    });
  }
  me.startServer = (socket, port) => {
    var server = me.servers[me.servers.length] = spawn('node', [path.join(__dirname, '../server')], {
      cwd: path.join(__dirname, '../'),
      env: {
        PORT: port
      }
    });
    stdioReplay('server', server, port);
    return server;
  };
  me.startPcap = (socket, port) => {
    var pcap = me.servers[me.servers.length] = spawn('tshark', ['-i', 'lo', '-f', "tcp port " + port + "", '-w',
      path.join(__dirname, '../captures', (new Date()).toISOString().replace(/:/g,'_',2)+'_Capture_port_'+port+'.pcapng')], {
      cwd: path.join(__dirname, '../'),
    });
    stdioReplay('pcap', pcap, port);
    return pcap;
  };
  me.startClient = (socket, port) => {
    var client = me.clients[me.clients.length] = spawn('node', [path.join(__dirname, '../client')], {
      cwd: path.join(__dirname, '../'),
      env: {
        PORT: port
      }
    });
    stdioReplay('client', client, port);
    return client;
  };
  me.startAttack = (socket, port) => {
    var attack = me.attacks[me.attacks.length] = spawn('node', [path.join(__dirname, '../attack')], {
      cwd: path.join(__dirname, '../'),
      env: {
        PORT: port
      }
    });
    stdioReplay('attack', attack, port);
    return attack;
  };
  me.stopAll = (socket, port) => {
    me.servers.map((server, index, servers) => {
      server.kill();
    });
    me.pcaps.map((pcap, index, pcaps) => {
      pcap.kill();
    });
    me.clients.map((client, index, clients) => {
      client.kill();
    });
    me.attacks.map((attack, index, attacks) => {
      attack.kill();
    });
    return server;
  };
  return me;
};

module.exports = controller;
