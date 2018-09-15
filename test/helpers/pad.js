const { marshalString, unmarshalString } = require("./marshal");

const DEFAULT_PAD_LENGTH = 2 * 32;

function padLeft(str, pad_length = DEFAULT_PAD_LENGTH) {
  return marshalString(web3.padLeft(unmarshalString(str), pad_length));
}

function padRight(str, pad_length = DEFAULT_PAD_LENGTH) {
  return marshalString(web3.padRight(unmarshalString(str), pad_length));
}

module.exports = {
  padLeft,
  padRight,
}
