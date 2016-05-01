const bigInt = require('big-integer');
var generateRandomPrime = require('./generate-prime').generateRandomPrime;

var privvy = {
  base: '',
  modulus: '',
  privateKey: '',
  publicKey: '',
  remotePublicKey: '',
  sharedSessionKey: '',
  updateKeys: function () {
    if (privvy.base &&
        privvy.modulus &&
        privvy.privateKey) {
          //generate public key
          privvy.publicKey = privvy.base.modPow(privvy.privateKey, privvy.modulus);
          if (privvy.remotePublicKey)
            privvy.sharedSessionKey = privvy.remotePublicKey.modPow(privvy.privateKey, privvy.modulus);
    }
  },
};

var KeyExchanger = module.exports = {
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
