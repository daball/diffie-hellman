module.exports = () => {
  var client = undefined;
  var nick = 'Anonymous';
  var isExiting = false;

  var rl = require('readline-sync');

  var connect = function connect (host, port) {
    return client = require('./client')(host, port);
  };
  var disconnect = function disconnect () {
    if (client) {
      client.disconnect();
    }
  };
  var send = function send (message) {
    if (client) {
      if (message)
        client.send(message);
    }
    else
      socket.emit('chat', { message: "You must be connected first." });
  };

  return {
    connect: connect,
    disconnect: disconnect,
    send: send
  };

  // var BeginREPL = () => {
  //   // const Promise = require('promise');
  //   // var replServer;
  //   // var doRepl = () => {
  //   //   return new Promise(function (fulfill, reject) {
  //       const repl = require('repl');
  //       replServer = repl.start({prompt: 'ClientREPL>'});
  //       replServer.context.client = client;
  //       replServer.context.connect = connect;
  //       replServer.context.send = send;
  //       replServer.context.disconnect = disconnect;
  //       replServer.on('exit', () => {
  //         // rl.prompt();
  //         // fulfill(replServer);
  //         if (!isExiting)
  //           CLLoop();
  //         if (!isExiting)
  //           BeginREPL();
  //       });
  //     // });
  //   // };
  // };
  // var CLLoop = () => {
  //   rl.promptCLLoop({
  //     '/connect': function(host, port) {
  //       while (!host) {
  //         host = rl.question("Host: ")
  //       }
  //       while (!port) {
  //         port = rl.question("Port: ");
  //       }
  //       console.log(client = connect(host, port));
  //     },
  //     '/disconnect': function() {
  //       if (client)
  //         console.log('Not connected.');
  //       // Do something...
  //     },
  //     '/exit': function() {
  //       return isExiting = true;
  //     },
  //     '/bye': function() {
  //       return isExiting = true;
  //     },
  //     '_': function(command) {
  //       if (client)
  //         send(command);
  //       else
  //         console.log("You are not connected.");
  //     }
  //   }, { prompt: 'Client>' });
  // };
  //
  // do {
    // CLLoop();
    // if (!isExiting)
    // // {
    //   BeginREPL();
    // else
    // }
// } while (!isExiting);

  // rl.setPrompt('Client> ');
  // rl.prompt();
  //
  // rl.on('line', (line) => {
  //   if (line.trim().indexOf('/repl') == 0) {
  //     const repl = require('repl');
  //     rl.pause();
  //     var replServer = repl.start({prompt: 'ClientREPL>'});
  //     var rooms = replServer.context.rooms = [];
  //     var users = replServer.context.users = [];
  //     replServer.context.connect = function (host, port) {
  //     };
  //     replServer.on('exit', () => {
  //       rl.prompt();
  //     });
  //   }
  //   else {
  //       console.log(clc.bold(line.trim()) + ' command invalid. Connect to the server first.');
  //       rl.prompt();
  //   }
  // }).on('close', () => {
    console.log('Have a nice day!');
  //   process.exit(0);
  // });-
}();
