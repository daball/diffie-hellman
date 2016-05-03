const bigInt = require('big-integer');
const generateRandomPrime = require('./generate-prime').generateRandomPrime;

module.exports = () => {
  var privvy = {
    base: bigInt(0),
    modulus: bigInt(0),
    privateKey: bigInt(0),
    publicKey: bigInt(0),
    remotePublicKey: bigInt(0),
    sharedSessionKey: bigInt(0),
    updateKeys: () => {
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
    generateRandomInt: () => {
      return bigInt.randBetween('1', '1e4096').toString();
    },

    /* SETTERS */
    setBase: (val) => {
      privvy.base = bigInt(val);
      privvy.updateKeys();
      return privvy.base;
    },
    setModulus: (val) => {
      privvy.modulus = bigInt(val);
      privvy.updateKeys();
      return privvy.modulus;
    },
    setPrivateKey: (val) => {
      privvy.privateKey = bigInt(val);
      privvy.updateKeys();
      return privvy.privateKey;
    },
    setRemotePublicKey: (val) => {
      privvy.remotePublicKey = bigInt(val);
      privvy.updateKeys();
      return privvy.remotePublicKey;
    },

    /* GETTERS */
    getBase: () => {
      return privvy.base;
    },
    getModulus: () => {
      return privvy.modulus;
    },
    getPrivateKey: () => {
      return privvy.privateKey;
    },
    getPublicKey: () => {
      return privvy.publicKey;
    },
    getRemotePublicKey: () => {
      return privvy.remotePublicKey;
    },
    getSessionKey: () => {
      return privvy.sharedSessionKey;
    },

    toString: () => {
      return  'privateKey=' + privvy.privateKey.toString() + ';' +
              'base=' + privvy.base.toString() + ';' +
              'modulus=' + privvy.modulus.toString() + ';' +
              'publicKey=' + privvy.publicKey.toString() + ';' +
              'remotePublicKey=' + privvy.remotePublicKey.toString() + ';' +
              'sharedSessionKey=' + privvy.sharedSessionKey.toString();
    }
  }

  return KeyExchanger;
}
