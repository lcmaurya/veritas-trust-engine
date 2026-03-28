const crypto = require('crypto');

const SECRET = "authority_secret_key";

function sign(data) {
  return crypto.createHmac('sha256', SECRET)
    .update(JSON.stringify(data))
    .digest('hex');
}

function verifySign(data, signature) {
  const check = sign(data);
  return check === signature;
}

module.exports = { sign, verifySign };
