function bold(html) { return "<b>"+html+"</b>"; }
function underline(html) { return "<u>"+html+"</u>"; }
const br = '<br />';

function formatMessage(nick, message) {
  return bold(nick) + bold("&gt;") + " " + message;
}

var net = require('net');

var ChatClient = {};
ChatClient.nick = '';
ChatClient.dhPeers = [];
ChatClient.client = undefined;
ChatClient.log = [];
var eventHandlers = {};
var trigger = (event, callback, data) => {
  if (eventHandlers[event] && eventHandlers[event].length)
    for (var h = 0; h < eventHandlers[event].length; h++)
      eventHandlers[event][h](data);
  if (callback) callback(data);
}

ChatClient.on = (event, eventHandler) => {
  if (ChatClient.client && (event == 'close' ||
      event == 'connect' ||
      event == 'data' ||
      event == 'drain' ||
      event == 'end' ||
      event == 'error' ||
      event == 'lookup' ||
      event == 'timeout'))
      ChatClient.client.on(event, eventHandler);
  if (
      event == 'client-connecting' ||
      event == 'client-connected' ||
      event == 'client-disconnected' ||
      event == 'client-message-received' ||
      event == 'client-message-sent' ||
      event == 'client-connection-error' ||
      event == 'client-new-nickname' ||
      event == 'client-peer-new-nickname' ||
      event == 'client-error' ||
      event == 'log') {
        if (!(eventHandlers[event] && eventHandlers[event].length))
          eventHandlers[event] = [];
        eventHandlers[event].push(eventHandler);
  }
  return ChatClient;
}
ChatClient.on('log', (event) => {
  console.log('[' + event.event + ']', event.message);
})
ChatClient.connect = (host, port, callback) => {
  if (ChatClient.client)
    ChatClient.client.end();
  ChatClient.client = net.connect(port, host);
  trigger('log', null, { event: 'client-connecting', message: 'Connecting to host ' + host + ':' + port + '.' });
  trigger('client-connecting', null, { message: formatMessage('CLIENT', 'Connecting to host ' + host + ':' + port + '.') });
  ChatClient.on('connect', (connection) => {
    trigger('log', null, { event: 'client-connected', message: 'Connected to host ' + host + ':' + port + '.' });
    trigger('client-connected', callback, { message: formatMessage('CLIENT', 'Connected to host ' + host + ':' + port + '.'), connection: connection });
  }).on('close', () => {
    trigger('log', null, { event: 'client-disconnected', message: 'The connection to ' + host + ':' + port + ' was closed.' });
    trigger('client-disconnected', null, { message: formatMessage('CLIENT', 'The connection to ' + host + ':' + port + ' was closed.') });
  }).on('end', () => {
    trigger('log', null, { event: 'client-disconnected', message: 'The connection to ' + host + ':' + port + ' ended.' });
    trigger('client-disconnected', null, { message: formatMessage('CLIENT', 'The connection to ' + host + ':' + port + ' ended.') });
  }).on('error', (error) => {
    trigger('log', null, { event: 'client-connection-error', message: 'There was a connection error. ' + error.message + '.' });
    trigger('client-connection-error', null, { message: formatMessage('CLIENT', 'There was a connection error. ' + error.message + '.'), error: error });
  }).on('timeout', (error) => {
    trigger('log', null, { event: 'client-connection-timeout', message: 'Connection to the chat server timed out.' });
    trigger('client-connection-error', null, { message: formatMessage('CLIENT', 'Connection to the chat server timed out.') });
  }).on('client-new-nickname', (chat) => {
    ChatClient.nick = chat.newNick;
  }).on('client-peer-new-nickname', (chat) => {
    for (var d = 0; d < ChatClient.dhPeers.length; d++) {
      if (ChatClient.dhPeers[d].nick == chat.oldNick) {
        ChatClient.dhPeers[d].nick = chat.newNick;
      }
    }
  }).on('client-message-received', (chat) => {
    var search = /^<b>SYSTEM<\/b><b>&gt;<\/b> Your nickname is (.*)\.<br \/>/;
    var matches = chat.message.match(search);
    if (matches) {
      var newNick = matches[1];
      trigger('log', null, { event: 'client-new-nickname', message: 'Your nickname is ' + newNick + '.' });
      trigger('client-new-nickname', null, { oldNick: ChatClient.nick, newNick: newNick, message: formatMessage('CLIENT', 'Your new nickname is ' + newNick + '.') });
    }
  }).on('client-message-received', (chat) => {
    var search = /^<b>SYSTEM<\/b><b>&gt;<\/b> User (.*) is now known as (.*)\.<br \/>/;
    var matches = chat.message.match(search);
    if (matches) {
      oldNick = matches[1];
      newNick = matches[2];
      trigger('log', null, { event: 'client-peer-new-nickname', message: 'User ' + oldNick + ' is now known as ' + newNick + '.' });
      trigger('client-peer-new-nickname', null, { oldNick: oldNick, newNick: newNick, message: formatMessage('CLIENT', 'User ' + oldNick + ' is now known as ' + newNick + '.') });
    }
  }).on('client-message-received', (chat) => {
    //receiving end of a /dh-syn
    var search = /^<b>(.*)<\/b><b>&gt;<\/b> \/dh-syn (\w+) (\d+)<br \/>/;
    var matches = chat.message.match(search);
    if (matches) {
      var sender = matches[1];
      var recipient = matches[2];
      var base = matches[3];
      if (recipient == ChatClient.nick) { //is it a message for me?
        var foundMatch = -1;
        for (var d = 0; d < ChatClient.dhPeers.length; d++) {
          if (ChatClient.dhPeers[d].nick == sender) {
            foundMatch = d;
          }
        }
        if (foundMatch == -1)
          foundMatch = ChatClient.dhPeers.length;
        ChatClient.dhPeers[foundMatch] = {
          nick: sender,
          exchange: require('../crypto/diffie-hellman')
        };
        ChatClient.dhPeers[foundMatch].exchange.setBase(base);
        trigger('log', null, { event: 'client-message-received', message: formatMessage('CLIENT', 'User ' + sender + ' has initiated a Diffie-Hellman key exchange with you. Stored base=' + ChatClient.dhPeers[foundMatch].exchange.getBase() + '. Use /dh-ack ' + sender + ' to continue.') });
        trigger('client-message-received', null, { message: formatMessage('CLIENT', 'User ' + sender + ' has initiated a Diffie-Hellman key exchange with you. Stored base=' + ChatClient.dhPeers[foundMatch].exchange.getBase() + '. Use /dh-ack ' + sender + ' to continue.') });
      }
    }
  }).on('client-message-received', (chat) => {
    //receiving end of a /dh-ack
    var search = /^<b>(.*)<\/b><b>&gt;<\/b> \/dh-ack (\w+) (\d+)<br \/>/;
    var matches = chat.message.match(search);
    if (matches) {
      var sender = matches[1];
      var recipient = matches[2];
      var modulus = matches[3];
      if (recipient == ChatClient.nick) { //is it a message for me?
        var foundMatch = -1;
        for (var d = 0; d < ChatClient.dhPeers.length; d++) {
          if (ChatClient.dhPeers[d].nick == sender) {
            foundMatch = d;
          }
        }
        if (foundMatch == -1)
          foundMatch = ChatClient.dhPeers.length;
        ChatClient.dhPeers[foundMatch] = {
          nick: sender,
          exchange: require('../crypto/diffie-hellman')
        };
        ChatClient.dhPeers[foundMatch].exchange.setModulus(modulus);
        trigger('log', null, { event: 'client-message-received', message: formatMessage('CLIENT', 'User ' + sender + ' has continued a Diffie-Hellman key exchange with you. Stored modulus=' + ChatClient.dhPeers[foundMatch].exchange.getModulus() + '. Use /dh-pub ' + sender + ' to finish.') });
        trigger('client-message-received', null, { message: formatMessage('CLIENT', 'User ' + sender + ' has continued a Diffie-Hellman key exchange with you. Stored modulus=' + ChatClient.dhPeers[foundMatch].exchange.getModulus() + '. Use /dh-pub ' + sender + ' to finish.') });
      }
    }
  }).on('client-message-received', (chat) => {
    //receiving end of a /dh-pub
    var search = /^<b>(.*)<\/b><b>&gt;<\/b> \/dh-pub (\w+) (\d+)<br \/>/;
    var matches = chat.message.match(search);
    if (matches) {
      var sender = matches[1];
      var recipient = matches[2];
      var remotePublicKey = matches[3];
      if (recipient == ChatClient.nick) { //is it a message for me?
        var foundMatch = -1;
        for (var d = 0; d < ChatClient.dhPeers.length; d++) {
          if (ChatClient.dhPeers[d].nick == sender) {
            foundMatch = d;
          }
        }
        if (foundMatch == -1)
          foundMatch = ChatClient.dhPeers.length;
        ChatClient.dhPeers[foundMatch] = {
          nick: sender,
          exchange: require('../crypto/diffie-hellman')
        };
        ChatClient.dhPeers[foundMatch].exchange.setRemotePublicKey(remotePublicKey);
        ChatClient.dhPeers[foundMatch].caesar = require('../crypto/caesar');
        ChatClient.dhPeers[foundMatch].caesar.setSecretKey(ChatClient.dhPeers[foundMatch].exchange.getSessionKey());
        ChatClient.dhPeers[foundMatch].aes256 = require('../crypto/aes256');
        ChatClient.dhPeers[foundMatch].aes256.setSecretKey(ChatClient.dhPeers[foundMatch].exchange.getSessionKey());
        trigger('log', null, { event: 'client-message-received', message: formatMessage('CLIENT', 'User ' + sender + ' has finished a Diffie-Hellman key exchange with you. Remote public key=' + ChatClient.dhPeers[foundMatch].exchange.getRemotePublicKey() + '. Use /dh-pub ' + sender + ' to return the favor. Generated Diffie-Hellman session key = ' + ChatClient.dhPeers[foundMatch].exchange.getSessionKey() + '. Using Diffie-Hellman session key SHA256 hash as AES-256 secret key. Generated Caesar Cipher secret key = ' + ChatClient.dhPeers[foundMatch].caesar.getSecretKey() + ' from Diffie-Hellman session key.') });
        trigger('client-message-received', null, { message: formatMessage('CLIENT', 'User ' + sender + ' has finished a Diffie-Hellman key exchange with you. Remote public key=' + ChatClient.dhPeers[foundMatch].exchange.getRemotePublicKey() + '. Use /dh-pub ' + sender + ' to return the favor. Generated Diffie-Hellman session key = ' + ChatClient.dhPeers[foundMatch].exchange.getSessionKey() + '. Using Diffie-Hellman session key SHA256 hash as AES-256 secret key. Generated Caesar Cipher secret key = ' + ChatClient.dhPeers[foundMatch].caesar.getSecretKey() + ' from Diffie-Hellman session key.') });
      }
    }
  }).on('client-message-received', (chat) => {
    //receiving end of a /cc-send
    var search = /^<b>(.*)<\/b><b>&gt;<\/b> \/cc-send (\w+) (.*)<br \/>/;
    var matches = chat.message.match(search);
    if (matches) {
      var sender = matches[1];
      var recipient = matches[2];
      var ciphertext = matches[3];
      if (recipient == ChatClient.nick) { //is it a message for me?
        var foundMatch = -1;
        for (var d = 0; d < ChatClient.dhPeers.length; d++) {
          if (ChatClient.dhPeers[d].nick == sender) {
            foundMatch = d;
          }
        }
        if (foundMatch != -1) {
          var plaintext = ChatClient.dhPeers[foundMatch].caesar.decrypt(ciphertext);
          trigger('log', null, { event: 'client-message-received', message: formatMessage('CLIENT', 'Decrypted message from ' + sender + ': ' + plaintext) });
          trigger('client-message-received', null, { message: formatMessage('CLIENT', 'Decrypted message from ' + sender + ': ' + plaintext) });
        }
      }
    }
  }).on('client-message-received', (chat) => {
    //receiving end of a /aes-send
    var search = /^<b>(.*)<\/b><b>&gt;<\/b> \/aes-send (\w+) (.*)<br \/>/;
    var matches = chat.message.match(search);
    if (matches) {
      var sender = matches[1];
      var recipient = matches[2];
      var ciphertext = matches[3];
      if (recipient == ChatClient.nick) { //is it a message for me?
        var foundMatch = -1;
        for (var d = 0; d < ChatClient.dhPeers.length; d++) {
          if (ChatClient.dhPeers[d].nick == sender) {
            foundMatch = d;
          }
        }
        if (foundMatch != -1) {
          try {
            var plaintext = ChatClient.dhPeers[foundMatch].aes256.decrypt(ciphertext);
            trigger('log', null, { event: 'client-message-received', message: formatMessage('CLIENT', 'Decrypted message from ' + sender + ': ' + plaintext) });
            trigger('client-message-received', null, { message: formatMessage('CLIENT', 'Decrypted message from ' + sender + ': ' + plaintext) });
          } catch (error) {
            trigger('log', null, { event: 'client-error', message: formatMessage('CLIENT', 'An error occurred while decrypting the message from ' + sender + ': ' + error) });
            trigger('client-error', null, { message: formatMessage('CLIENT', 'An error occurred while decrypting the message from ' + sender + ': ' + error) });
          }
        }
      }
    }
  }).on('data', (data) => {
    trigger('log', null, { event: 'data', message: data.toString().trim() });
    var chats = data.toString().trim().split('<br />');
    for (var c = 0; c < chats.length; c++) {
      if (chats[c]) {
        trigger('log', null, { event: 'client-message-received', message: chats[c].trim() + br });
        trigger('client-message-received', null, { message: chats[c].trim() + br });
      }
    }
    if (chats.length == 0)
      trigger('client-message-received', null, { message: data.toString().trim() });
  });
  return ChatClient;
};
ChatClient.send = (chat, callback) => {
  if (ChatClient.client) {
    var searchSyn = /^\/dh-syn (.*)/;
    var matchesSyn = chat.match(searchSyn);
    var searchAck = /^\/dh-ack (.*)/;
    var matchesAck = chat.match(searchAck);
    var searchPub = /^\/dh-pub (.*)/;
    var matchesPub = chat.match(searchPub);
    var searchCC = /^\/cc-send (\w+) (.*)/;
    var matchesCC = chat.match(searchCC);
    var searchAES = /^\/aes-send (\w+) (.*)/;
    var matchesAES = chat.match(searchAES);
    if (matchesSyn) { //process client side of /dh-syn
      var foundMatch = -1;
      for (var d = 0; d < ChatClient.dhPeers.length; d++) {
        if (ChatClient.dhPeers[d].nick == matchesSyn[1]) {
          foundMatch = d;
        }
      }
      if (foundMatch == -1)
        foundMatch = ChatClient.dhPeers.length;
      ChatClient.dhPeers[foundMatch] = {
        nick: matchesSyn[1],
        exchange: require('../crypto/diffie-hellman')
      };
      //generate a and p, we'll let the peer create b and q
      ChatClient.dhPeers[foundMatch].exchange.setPrivateKey(ChatClient.dhPeers[foundMatch].exchange.generateRandomInt());
      ChatClient.dhPeers[foundMatch].exchange.generateRandomPrime((rnd) => {
        ChatClient.dhPeers[foundMatch].exchange.setBase(rnd);
        //append random prime to chat
        chat += ' ' + ChatClient.dhPeers[foundMatch].exchange.getBase();
        ChatClient.client.write(chat, () => {
          trigger('log', null, { event: 'client-message-sent', message: chat });
          trigger('client-message-sent', callback, { message: chat });
          trigger('log', null, { event: 'client-message-received', message: formatMessage('CLIENT', 'Starting Diffie-Hellman key exchange with base=' + ChatClient.dhPeers[foundMatch].exchange.getBase() + '. Waiting for a /dh-ack ' + ChatClient.nick + ' to continue.') });
          trigger('client-message-received', null, { message: formatMessage('CLIENT', 'Starting Diffie-Hellman key exchange with base=' + ChatClient.dhPeers[foundMatch].exchange.getBase() + '. Waiting for a /dh-ack ' + ChatClient.nick + ' to continue.') });
        });
      });
    }
    else if (matchesAck) { //process client side of /dh-ack
      var foundMatch = -1;
      for (var d = 0; d < ChatClient.dhPeers.length; d++) {
        if (ChatClient.dhPeers[d].nick == matchesAck[1]) {
          foundMatch = d;
        }
      }
      if (foundMatch == -1)
        foundMatch = ChatClient.dhPeers.length;
      ChatClient.dhPeers[foundMatch] = {
        nick: matchesAck[1],
        exchange: require('../crypto/diffie-hellman')
      };
      //generate b and q and B
      ChatClient.dhPeers[foundMatch].exchange.setPrivateKey(ChatClient.dhPeers[foundMatch].exchange.generateRandomInt());
      ChatClient.dhPeers[foundMatch].exchange.generateRandomPrime((rnd) => {
        console.log(ChatClient, ChatClient.dhPeers, foundMatch, ChatClient.dhPeers[foundMatch]);
        ChatClient.dhPeers[foundMatch].exchange.setModulus(rnd);
        //append random prime to chat
        chat += ' ' + ChatClient.dhPeers[foundMatch].exchange.getModulus();
        ChatClient.client.write(chat, () => {
          trigger('log', null, { event: 'client-message-sent', message: chat });
          trigger('client-message-sent', callback, { message: chat });
          trigger('log', null, { event: 'client-message-received', message: formatMessage('CLIENT', 'Continuing Diffie-Hellman key exchange with modulus=' + ChatClient.dhPeers[foundMatch].exchange.getModulus() + '. Use /dh-pub ' + matchesAck[1] + ' to finish.') });
          trigger('client-message-received', null, { message: formatMessage('CLIENT', 'Continuing Diffie-Hellman key exchange with modulus=' + ChatClient.dhPeers[foundMatch].exchange.getModulus() + '. Use /dh-pub ' + matchesAck[1] + ' to finish.') });
        });
      });
    }
    else if (matchesPub) { //process client side of /dh-pub
      var foundMatch = -1;
      for (var d = 0; d < ChatClient.dhPeers.length; d++) {
        if (ChatClient.dhPeers[d].nick == matchesPub[1]) {
          foundMatch = d;
        }
      }
      if (foundMatch > -1) {
        //append my public key to chat
        chat += ' ' + ChatClient.dhPeers[foundMatch].exchange.getPublicKey();
        ChatClient.client.write(chat, () => {
          trigger('log', null, { event: 'client-message-sent', message: chat });
          trigger('client-message-sent', callback, { message: chat });
          trigger('log', null, { event: 'client-message-received', message: formatMessage('CLIENT', 'Finishing Diffie-Hellman key exchange with public key=' + ChatClient.dhPeers[foundMatch].exchange.getPublicKey() + '.') });
          trigger('client-message-received', null, { message: formatMessage('CLIENT', 'Finishing Diffie-Hellman key exchange with public key=' + ChatClient.dhPeers[foundMatch].exchange.getPublicKey() + '.') });
        });
      }
    }
    else if (matchesCC) { //process client side of /cc-send
      var foundMatch = -1;
      for (var d = 0; d < ChatClient.dhPeers.length; d++) {
        if (ChatClient.dhPeers[d].nick == matchesCC[1]) {
          foundMatch = d;
        }
      }
      if (foundMatch > -1 &&
        ChatClient.dhPeers[foundMatch].caesar) {
        //append my public key to chat
        var plaintext = matchesCC[2];
        var ciphertext = ChatClient.dhPeers[foundMatch].caesar.encrypt(plaintext);
        var cipherChat = '/cc-send ' + matchesCC[1] + ' ' + ciphertext;
        ChatClient.client.write(cipherChat, () => {
          trigger('log', null, { event: 'client-message-sent', message: cipherChat });
          trigger('client-message-sent', callback, { message: cipherChat });
          trigger('log', null, { event: 'client-message-received', message: formatMessage('CLIENT', 'Encrypted message for ' + matchesCC[1] + ' with Caesar Cipher before sending. ' + chat) });
          trigger('client-message-received', null, { message: formatMessage('CLIENT', 'Encrypted message for ' + matchesCC[1] + ' with Caesar Cipher before sending. ' + chat) });
        });
      }
      else {
        trigger('log', null, { event: 'client-message-received', message: formatMessage('CLIENT', 'You need to complete a Diffie-Hellman key exchange first.') });
        trigger('client-message-received', null, { message: formatMessage('CLIENT', 'You need to complete a Diffie-Hellman key exchange first.') });
      }
    }
    else if (matchesAES) { //process client side of /aes-send
      var foundMatch = -1;
      for (var d = 0; d < ChatClient.dhPeers.length; d++) {
        if (ChatClient.dhPeers[d].nick == matchesAES[1]) {
          foundMatch = d;
        }
      }
      if (foundMatch > -1 &&
        ChatClient.dhPeers[foundMatch].aes256) {
        //append my public key to chat
        var plaintext = matchesAES[2];
        var ciphertext = ChatClient.dhPeers[foundMatch].aes256.encrypt(plaintext);
        var cipherChat = '/aes-send ' + matchesAES[1] + ' ' + ciphertext;
        ChatClient.client.write(cipherChat, () => {
          trigger('log', null, { event: 'client-message-sent', message: cipherChat });
          trigger('client-message-sent', callback, { message: cipherChat });
          trigger('log', null, { event: 'client-message-received', message: formatMessage('CLIENT', 'Encrypted message for ' + matchesAES[1] + ' with AES-256 before sending. ' + chat) });
          trigger('client-message-received', null, { message: formatMessage('CLIENT', 'Encrypted message for ' + matchesAES[1] + ' with AES-256 before sending. ' + chat) });
        });
      }
      else {
        trigger('log', null, { event: 'client-message-received', message: formatMessage('CLIENT', 'You need to complete a Diffie-Hellman key exchange first.') });
        trigger('client-message-received', null, { message: formatMessage('CLIENT', 'You need to complete a Diffie-Hellman key exchange first.') });
      }
    }
    else ChatClient.client.write(chat, () => {
      trigger('log', null, { event: 'client-message-sent', message: chat });
      trigger('client-message-sent', callback, { message: chat });
    });
  }
  else if (ChatClient.client) {
    ChatClient.client.write(chat, () => {
      trigger('log', null, { event: 'client-message-sent', message: chat });
      trigger('client-message-sent', callback, { message: chat });
    });
  }
  else {
    trigger('log', null, { event: 'client-error', message: 'You are not connected to a chat server.' });
    trigger('client-error', callback, { message: formatMessage('CLIENT', 'You are not connected to a chat server.') })
  }
};

module.exports = ChatClient;
