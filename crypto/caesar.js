function prevInCircle(min, max, i, n) {
  if (!n) n = 1;
  for (var c = 0; c < n; c++) {
    i = (--i < min) ? max : i;
  }
  return i;
}
function nextInCircle(min, max, i, n) {
  if (!n) n = 1;
  for (var c = 0; c < n; c++) {
    i = (++i > max) ? min : i;
  }
  return i;
}

function caesar(transposeKey, text) {
  var max = 26;
  var cipher = "";
  for (var c = 0; c < text.length; c++) {
    var ch = text.charCodeAt(c);
    if (transposeKey > 0) {
      if (ch >= 65 && ch <= 90)
        ch = nextInCircle(65, 90, ch, transposeKey);
      else if (ch >= 97 && ch <= 122)
        ch = nextInCircle(97, 122, ch, transposeKey);
    }
    else if (transposeKey < 0) {
      if (ch >= 65 && ch <= 90)
        ch = prevInCircle(65, 90, ch, Math.abs(transposeKey));
      else if (ch >= 97 && ch <= 122)
        ch = prevInCircle(97, 122, ch, Math.abs(transposeKey));
    }
    cipher += String.fromCharCode(ch);
  }
  return cipher;
}

module.exports = () => {
  var secretKey = 0;
  return {
    setSecretKey: (val) => { return secretKey = Math.abs(val%26); },
    getSecretKey: () => { return secretKey; },
    encrypt: (plaintext) => { return caesar(secretKey, plaintext); },
    decrypt: (ciphertext) => { return caesar(-1 * secretKey, ciphertext); },
  };
};
