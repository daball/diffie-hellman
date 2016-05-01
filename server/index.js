module.exports = () => {
  var clc = require('cli-color');

  console.log(clc.bold('Diffie Hellman Chat Server'));
  console.log(clc.bold('(c) David Ball 2016.'));
  console.log('LICENSE: BSD');
  console.log();

  const repl = require('repl');

  var server = undefined;
  var replServer = repl.start({prompt: 'Server>'});
  var listen = replServer.context.listen = function (port) {
    return server = require('./server')(port);
  };

  return {
    server: server,
    listen: listen,
  };
}();
