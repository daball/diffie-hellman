const path = require('path');
const fs = require('fs');

//uses primes/primes*.txt in order to generate a known prime
//thanks Chris K. Caldwell <caldwell@utm.edu> for the lists
//callback required because fs calls are non-blocking, async
module.exports = {};
module.exports.generateRandomPrime = (callback) => {
  var primeSet = (Math.floor(Math.random()*50)+1);
  var primeSetFile = path.join(__dirname, 'primes', 'primes' + primeSet + '.txt');
  var primesInSet = [];
  var primeInSet = -1;

  fs.readFile(primeSetFile, (err, data) => {
    if (err) throw err;
    data = data.toString();
    data = data.replace('\r\n','\n');

    var lines = data.split('\n');
    for (l = 2; l < lines.length; l++) {
      if (lines[l].trim().length)
        lines[l] = lines[l].trim().split(' ').map((currentValue, index, array) => {
          if (currentValue)
            primesInSet[primesInSet.length] = currentValue;
        })
    }
    primeInSet = Math.floor(Math.random()*primesInSet.length);
    primeInSet = primesInSet[primeInSet];
    if (callback)
      callback(primeInSet);
  });
}
