function bold(html) { return "<b>"+html+"</b>"; }
function underline(html) { return "<u>"+html+"</u>"; }
const br = '<br />';

function resolveConnectionBySocket(connections, socket) {
  for (var c = 0; c < connections.length; c++) {
    if (connections[c].socket.remoteAddress == socket.remoteAddress &&
        connections[c].socket.remoteFamily == socket.remoteFamily &&
        connections[c].socket.remotePort == socket.remotePort)
        {
          return c;
        }
  }
  return -1;
}
function resolveConnectionByNick(connections, nick) {
  for (var c = 0; c < connections.length; c++)
    if (connections[c].nick == nick)
          return c;
  return -1;
}

function formatMessage(nick, message) {
  return bold(nick) + bold("&gt;") + " " + message;
}

const net = require('net');
var DH = require('../crypto/diffie-hellman');

function ChatRelay() {
  var ChatRelay = {};
  ChatRelay.server = net.createServer();
  ChatRelay.connections = [];
  ChatRelay.dhPeers = {};
  ChatRelay.appendMessages = "";
  var eventHandlers = {};
  var anonCursor = 1;
  var trigger = (event, callback, data) => {
    //log all events
    if (eventHandlers[event] && eventHandlers[event].length)
      for (var h = 0; h < eventHandlers[event].length; h++)
        eventHandlers[event][h](data);
    if (callback) callback(data);
  }
  ChatRelay.on = (event, eventHandler) => {
    if (ChatRelay.server && (event == 'close' ||
        event == 'connection' ||
        event == 'error' ||
        event == 'listening'))
        ChatRelay.server.on(event, eventHandler);
    if (event == 'relay-started' ||
        event == 'relay-stopped' ||
        event == 'relay-send-all' ||
        event == 'relay-send-client' ||
        event == 'relay-client-connected' ||
        event == 'relay-chat-received' ||
        event == 'relay-secure-chat-compromised' ||
        event == 'client-message-sent' ||
        event == 'relay-client-renamed' ||
        event == 'relay-client-disconnected' ||
        event == 'relay-to-server' ||
        event == 'relay-from-server' ||
        event == 'log') {
          if (!(eventHandlers[event] && eventHandlers[event].length))
            eventHandlers[event] = [];
          eventHandlers[event].push(eventHandler);
    }
    return ChatRelay;
  }
  ChatRelay.on('log', (event) => {
    console.log('[' + event.event + ']', event.message);
  });
  ChatRelay.start = (listenOptions, clientHost, clientPort, callback) => {
    ChatRelay.clientHost = clientHost;
    ChatRelay.clientPort = clientPort;
    ChatRelay.server.listen(listenOptions, () => {
      var address = ChatRelay.server.address();
      trigger('log', null, { event: 'relay-started', message: "Server started with " + address.family + " on interface " + address.address + " listening on port " + address.port + "." });
      trigger('relay-started', callback, address);
      //handle motd and user online notification
      ChatRelay.on('relay-client-connected', function (connection) {
        //Open ChatClient to server for each incoming client.
        connection.client = net.connect(ChatRelay.clientPort, ChatRelay.clientHost);
        connection.client.on('data', (data) => {
          trigger('log', null, { event: 'data', message: data.toString().trim() });
          var chats = data.toString().trim().split('<br />');
          for (var c = 0; c < chats.length; c++) {
            if (chats[c]) {
              trigger('log', null, { event: 'relay-from-server', message: chats[c].trim() + br });
              trigger('relay-from-server', null, {message:chats[c].trim() + br,connection:connection,nick:connection.nick});
              trigger('log', null, { event: 'client-message-received', message: chats[c].trim() + br });
            }
          }
          if (chats.length == 0){
            trigger('log', null, { event: 'relay-from-server', message: chats[c].trim() + br });
            trigger('relay-from-server', null, {message:data.toString().trim(),connection:connection,nick:connection.nick});
          }
        });
      });
      ChatRelay.on('relay-from-server', (data) => {
        var chat = data.message;
        var nick = data.nick;
        var connection = data.connection||ChatRelay.connections[resolveConnectionByNick(ChatRelay.connections, nick)];
        //check for new nickname
        var search = /^<b>SYSTEM<\/b><b>&gt;<\/b> Your nickname is (.*)\.<br \/>/;
        var matches = chat.match(search);
        if (matches) {
          var oldNick = nick;
          var newNick = matches[1];
          if (ChatRelay.dhPeers[oldNick])
            ChatRelay.dhPeers[newNick] = ChatRelay.dhPeers[oldNick];
          for (var p = 0; p < ChatRelay.dhPeers; p++) {
            if (ChatRelay.dhPeers[p].nick == oldNick)
              ChatRelay.dhPeers[p].nick == newNick;
            if (ChatRelay.dhPeers[p][oldNick])
              ChatRelay.dhPeers[p][newNick] = ChatRelay.dhPeers[p][oldNick];
          }
          for (var c = 0; c < ChatRelay.connections.length; c++) {
            if (ChatRelay.connections[c].nick == oldNick) {
              ChatRelay.connections[c].nick = newNick;
            }
          }
          nick = newNick;
          trigger('log', null, { event: 'relay-client-renamed', message: 'Your nickname is ' + newNick + '.' });
          trigger('relay-client-renamed', null, { oldNick: oldNick, newNick: newNick, message: formatMessage('CLIENT', 'Your new nickname is ' + newNick + '.') });
          connection = ChatRelay.connections[resolveConnectionByNick(ChatRelay.connections, nick)];
        }
        var searchSyn = /^<b>(.*)<\/b><b>&gt;<\/b> \/dh-syn (\w+) (\d+)<br \/>/;
        var matchesSyn = chat.match(searchSyn);
        var searchAck = /^<b>(.*)<\/b><b>&gt;<\/b> \/dh-ack (\w+) (\d+)<br \/>/;
        var matchesAck = chat.match(searchAck);
        var searchPub = /^<b>(.*)<\/b><b>&gt;<\/b> \/dh-pub (\w+) (\d+)<br \/>/;
        var matchesPub = chat.match(searchPub);
        var searchCC = /^<b>(.*)<\/b><b>&gt;<\/b> \/cc-send (\w+) (.*)<br \/>/;
        var matchesCC = chat.match(searchCC);
        var searchAES = /^<b>(.*)<\/b><b>&gt;<\/b> \/aes-send (\w+) (.*)<br \/>/;
        var matchesAES = chat.match(searchAES);
        if (matchesSyn) { //process A->RB receiving end of /dh-syn
          var sender = matchesSyn[1];
          var recipient = matchesSyn[2];
          var base = matchesSyn[3];
          if (recipient == connection.nick) { //is it a message for me?
            if (!ChatRelay.dhPeers[sender]) {
              ChatRelay.dhPeers[sender] = [];
              ChatRelay.dhPeers[sender][recipient] = {
                from: sender,
                to: recipient,
                exchange: DH()
              };
            }
            if (!ChatRelay.dhPeers[recipient]) {
              ChatRelay.dhPeers[recipient] = [];
              ChatRelay.dhPeers[recipient][sender] = {
                from: recipient,
                to: sender,
                exchange: DH()
              };
            }
            var mitmPrivateKey = DH().generateRandomInt();
            ChatRelay.dhPeers[sender][recipient].exchange.setPrivateKey(mitmPrivateKey);
            ChatRelay.dhPeers[recipient][sender].exchange.setPrivateKey(mitmPrivateKey);
            ChatRelay.dhPeers[sender][recipient].exchange.setBase(base);
            ChatRelay.dhPeers[recipient][sender].exchange.setBase(base);
          }
        }
        else if (matchesAck) { //process B->RA receiving end of /dh-ack
          var sender = matchesAck[1];
          var recipient = matchesAck[2];
          var modulus = matchesAck[3];
          if (recipient == connection.nick) { //is it a message for me?
            if (!ChatRelay.dhPeers[sender]) {
              ChatRelay.dhPeers[sender] = [];
              ChatRelay.dhPeers[sender][recipient] = {
                from: sender,
                to: recipient,
                exchange: DH()
              };
            }
            if (!ChatRelay.dhPeers[recipient]) {
              ChatRelay.dhPeers[recipient] = [];
              ChatRelay.dhPeers[recipient][sender] = {
                from: recipient,
                to: sender,
                exchange: DH()
              };
            }
            ChatRelay.dhPeers[sender][recipient].exchange.setModulus(modulus);
            ChatRelay.dhPeers[recipient][sender].exchange.setModulus(modulus);
          }
        }
        else if (matchesPub) { //process A->RB/B->RA receiving end of /dh-pub
          var sender = matchesPub[1];
          var recipient = matchesPub[2];
          var remotePublicKey = matchesPub[3];
          console.log('matchesPub',matchesPub,'sender',sender,'recipient',recipient,'remotePublicKey',remotePublicKey,'connection.nick',connection.nick);
          if (recipient == connection.nick) { //is it a message for me?
            if (!ChatRelay.dhPeers[sender]) {
              ChatRelay.dhPeers[sender] = [];
              ChatRelay.dhPeers[sender][recipient] = {
                from: sender,
                to: recipient,
                exchange: DH()
              };
            }
            if (!ChatRelay.dhPeers[recipient]) {
              ChatRelay.dhPeers[recipient] = [];
              ChatRelay.dhPeers[recipient][sender] = {
                from: recipient,
                to: sender,
                exchange: DH()
              };
            }
            ChatRelay.dhPeers[sender][recipient].exchange.setRemotePublicKey(remotePublicKey);

            ChatRelay.dhPeers[sender][recipient].caesar = require('../crypto/caesar')();
            ChatRelay.dhPeers[sender][recipient].aes256 = require('../crypto/aes256')();
            ChatRelay.dhPeers[sender][recipient].caesar.setSecretKey(ChatRelay.dhPeers[sender][recipient].exchange.getSessionKey());
            ChatRelay.dhPeers[sender][recipient].aes256.setSecretKey(ChatRelay.dhPeers[sender][recipient].exchange.getSessionKey());

            ChatRelay.dhPeers[recipient][sender].caesar = require('../crypto/caesar')();
            ChatRelay.dhPeers[recipient][sender].aes256 = require('../crypto/aes256')();
            ChatRelay.dhPeers[recipient][sender].caesar.setSecretKey(ChatRelay.dhPeers[recipient][sender].exchange.getSessionKey());
            ChatRelay.dhPeers[recipient][sender].aes256.setSecretKey(ChatRelay.dhPeers[recipient][sender].exchange.getSessionKey());
            //overwrite message with one crafted just for the client
            chat = "<b>" + sender + "</b><b>&gt;</b> /dh-pub " + recipient + " " + ChatRelay.dhPeers[sender][recipient].exchange.getPublicKey(); + "<br />";
          }
        }
        else if (matchesCC) {
          var sender = matchesCC[1];
          var recipient = matchesCC[2];
          var ciphertext = matchesCC[3];
          if (ChatRelay.dhPeers[sender][recipient] &&
              ChatRelay.dhPeers[sender][recipient] &&
              ChatRelay.dhPeers[sender][recipient].caesar) {
              //append my public key to chat
              var plaintext = ChatRelay.dhPeers[sender][recipient].caesar.decrypt(ciphertext);
              trigger('log', null, { event: 'relay-secure-chat-compromised', message: plaintext, sender: sender, recipient: recipient });
              trigger('relay-secure-chat-compromised', null, { message: plaintext, sender: sender, recipient: recipient });
              ciphertext = ChatRelay.dhPeers[recipient][sender].caesar.encrypt(plaintext);
              chat = "<b>" + sender + "</b><b>&gt;</b> /cc-send " + recipient + ' ' + ciphertext;
              // connection.write(cipherChat, () => {
              //   trigger('log', null, { event: 'client-message-sent', message: cipherChat });
              //   trigger('client-message-sent', callback, { message: cipherChat });
              //   trigger('log', null, { event: 'client-message-received', message: formatMessage('CLIENT', 'Encrypted message for ' + matchesCC[1] + ' with Caesar Cipher before sending. ' + chat) });
              //   trigger('client-message-received', null, { message: formatMessage('CLIENT', 'Encrypted message for ' + matchesCC[1] + ' with Caesar Cipher before sending. ' + chat) });
              // });
          }
          else {
            trigger('log', null, { event: 'client-message-received', message: formatMessage('CLIENT', 'You need to complete a Diffie-Hellman key exchange first.') });
            trigger('client-message-received', null, { message: formatMessage('CLIENT', 'You need to complete a Diffie-Hellman key exchange first.') });
          }
        }
        else if (matchesAES) {
          var sender = matchesAES[1];
          var recipient = matchesAES[2];
          var ciphertext = matchesAES[3];
          if (ChatRelay.dhPeers[sender][recipient] &&
              ChatRelay.dhPeers[sender][recipient] &&
              ChatRelay.dhPeers[sender][recipient].caesar) {
              //append my public key to chat
              var plaintext = ChatRelay.dhPeers[sender][recipient].aes256.decrypt(ciphertext);
              trigger('log', null, { event: 'relay-secure-chat-compromised', message: plaintext, sender: sender, recipient: recipient });
              trigger('relay-secure-chat-compromised', null, { message: plaintext, sender: sender, recipient: recipient });
              ciphertext = ChatRelay.dhPeers[recipient][sender].aes256.encrypt(plaintext);
              chat = "<b>" + sender + "</b><b>&gt;</b> /cc-send " + recipient + ' ' + ciphertext;
              // connection.write(cipherChat, () => {
              //   trigger('log', null, { event: 'client-message-sent', message: cipherChat });
              //   trigger('client-message-sent', callback, { message: cipherChat });
              //   trigger('log', null, { event: 'client-message-received', message: formatMessage('CLIENT', 'Encrypted message for ' + matchesCC[1] + ' with Caesar Cipher before sending. ' + chat) });
              //   trigger('client-message-received', null, { message: formatMessage('CLIENT', 'Encrypted message for ' + matchesCC[1] + ' with Caesar Cipher before sending. ' + chat) });
              // });
          }
          else {
            trigger('log', null, { event: 'relay-chat-received', message: formatMessage('CLIENT', 'You need to complete a Diffie-Hellman key exchange first.') });
            trigger('relay-chat-received', null, { message: formatMessage('CLIENT', 'You need to complete a Diffie-Hellman key exchange first.') });
          }
        }
        //On each message, relay to user
        if (chat)
          console.log('ChatRelay.sendToUser():',connection,nick, chat + ChatRelay.appendMessages);
        if (chat)
          ChatRelay.sendToUser(nick, chat + ChatRelay.appendMessages);
      });
      //handle user offline notification
      ChatRelay.on('relay-client-disconnected', (result) => {
        //Close ChatClient to server.
        if (typeof connection != 'undefined')
          connection.client.close();
      });
      //replay chats to the server
      ChatRelay.on('relay-chat-received', (data) => {
        ChatRelay.relayToServerAs(data.nick, data.message);
      });
      // handle chat client connection, then trigger server-client-connected
      ChatRelay.on('connection', (socket) => {
        var connection = {
          socket: socket,
          nick: 'Unassigned'+(anonCursor++),
          client: require('./ChatClient'),
        };
        ChatRelay.connections.push(connection);
        trigger('log', null, { event: 'relay-client-connected', message: 'Client connected.', connection: connection });
        trigger('relay-client-connected', null, connection);

        //handle chat client chat
        socket.on('data', (data) => {
          data = data.toString();
          var user = ChatRelay.connections[resolveConnectionBySocket(ChatRelay.connections, socket)];
          trigger('log', null, { event: 'relay-chat-received', message: formatMessage(user.nick, data)});
          trigger('relay-chat-received', null, { nick: user.nick, message: data });
        });

        //handle chat client close
        socket.on('close', (had_error) => {
          c = resolveConnectionBySocket(ChatRelay.connections, socket);
          if (c != -1) {
            var connection = ChatRelay.connections[c];
            ChatRelay.connections.splice(c, 1);
            trigger('log', null, { event: 'relay-client-disconnected', message: "User " + connection.nick + " has left."});
            trigger('relay-client-disconnected', null, { nick: connection.nick, connection: connection, message: "User " + connection.nick + " has left." });
          }
        });
      });
    });
  };
  ChatRelay.stop = (options, callback) => {
    server.close(options, () => {
      server.connections = [];
      server.backlog = "";
      anonCursor = 0;
      var address = ChatRelay.server.address();
      trigger('log', null, { event: 'relay-stopped', message: "Server stopped with " + address.family + " on interface " + address.address + " listening on port " + address.port + "." });
      trigger('relay-stopped', callback, address);
    });
  };
  ChatRelay.sendToAll = (chat, callback) => {
    console.log(chat);
    for (var c = 0; c < ChatRelay.connections.length; c++) {
      try {
        ChatRelay.connections[c].socket.write(chat+br);
      } catch (e) {}
    }
    trigger('log', null, { event: 'relay-send-all', message: chat });
    trigger('relay-send-all', callback, ChatRelay.server);
  };
  ChatRelay.sendToUser = (recipient, chat, callback) => {
    for (var c = 0; c < ChatRelay.connections.length; c++) {
      if (ChatRelay.connections[c].nick == recipient) {
        try {
          ChatRelay.connections[c].socket.write(chat+br);
        } catch (e) {}
        trigger('log', null, { event: 'relay-send-user', message: bold('@') + bold(recipient) + ' ' + chat });
        trigger('relay-send-user', callback, chat);
      }
    }
  };
  ChatRelay.relayToServerAs = (whom, chat, callback) => {
    for (var c = 0; c < ChatRelay.connections.length; c++) {
      if (ChatRelay.connections[c].nick == whom) {
        try {
          ChatRelay.connections[c].client.write(chat);
        } catch (e) {}
        trigger('log', null, { event: 'relay-to-server', message: chat });
        trigger('relay-to-server', callback, ChatRelay.server);
      }
    }
  };
  return ChatRelay;
}

module.exports = ChatRelay;
