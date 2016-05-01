const clc = require('cli-color');

console.log(clc.bold('Diffie Hellman Demo'));
console.log(clc.bold('(c) David Ball 2016.'));
console.log('LICENSE: BSD');
console.log();

//load all menus
var roles = {
  'server': require('../server'),
  'client': require('../client'),
};

module.exports = roles;
