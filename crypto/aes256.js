const aes256 = require('nodejs-aes256');
var secretKey = '';

module.exports = {
  setSecretKey: (val) => { return secretKey = val.toString(); },
  getSecretKey: () => { return secretKey; },
  encrypt: (plaintext) => { return aes256.encrypt(secretKey, plaintext); },
  decrypt: (ciphertext) => { return aes256.decrypt(secretKey, ciphertext); },
};
