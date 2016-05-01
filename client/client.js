module.exports = function ChatClient(host, port) {
  const clc = require('cli-color');
  const net = require('net');
  var nick = 'Anonymous';
  console.log('Connecting to ' + host + ':' + port + '...');
  client.on('connect', () => {
    console.log('Connected to host ' + host + ':' + port + '.');
  });
  client.on('data', (data) => {
    data = JSON.parse(data.toString());
    console.log(bold(data.nick||"SYSTEM") + bold(">") + " " + data.message);
  });
  client.on('end', () => {
    console.log('Disconnected from host ' + host + ':' + port + '.');
  });
  const disconnect = () => {
    client.end();
  };
  var send = function send(message) {
    client.write(message);
  };
  return {
    host: host,
    port: port,
    nick: nick,
    send: send,
    disconnect: disconnect,
    // onMessage: onMessage
    client: client,
  };
};
