const bigInt = require('big-integer');
const generateRandomPrime = require('./generate-prime').generateRandomPrime;

module.exports = function () {
  var privvy = {
    base: bigInt(0),
    modulus: bigInt(0),
    privateKey: bigInt(0),
    publicKey: bigInt(0),
    remotePublicKey: bigInt(0),
    sharedSessionKey: bigInt(0),
    updateKeys: function () {
      if (privvy.base > 0 &&
          privvy.modulus > 0 &&
          privvy.privateKey > 0) {
            //generate public key
            privvy.publicKey = privvy.base.modPow(privvy.privateKey, privvy.modulus);
            if (privvy.remotePublicKey > 0)
              privvy.sharedSessionKey = privvy.remotePublicKey.modPow(privvy.privateKey, privvy.modulus);
      }
    },
  };

  var KeyExchanger = {
    generateRandomPrime: generateRandomPrime,
    generateRandomInt: function () {
      return bigInt.randBetween('1', '1e4096').toString();
    },

    /* SETTERS */
    setBase: function (val) {
      privvy.base = bigInt(val);
      privvy.updateKeys();
      return privvy.base;
    },
    setModulus: function (val) {
      privvy.modulus = bigInt(val);
      privvy.updateKeys();
      return privvy.modulus;
    },
    setPrivateKey: function (val) {
      privvy.privateKey = bigInt(val);
      privvy.updateKeys();
      return privvy.privateKey;
    },
    setRemotePublicKey: function (val) {
      privvy.remotePublicKey = bigInt(val);
      privvy.updateKeys();
      return privvy.remotePublicKey;
    },

    /* GETTERS */
    getBase: function () {
      return privvy.base;
    },
    getModulus: function (val) {
      return privvy.modulus;
    },
    getPrivateKey: function (val) {
      return privvy.privateKey;
    },
    getPublicKey: function (val) {
      return privvy.publicKey;
    },
    getRemotePublicKey: function (val) {
      return privvy.remotePublicKey;
    },
    getSessionKey: function (val) {
      return privvy.sharedSessionKey;
    },
  }

  return KeyExchanger;
}
