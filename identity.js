const crypto = require('crypto');
const fs = require('fs');

const PRIVATE_KEY = fs.readFileSync('./private.pem', 'utf8');

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function createProof(name, dob) {

  const hash = sha256(name + dob);

  const sign = crypto.createSign('SHA256');
  sign.update(hash);
  sign.end();

  const signature = sign.sign(PRIVATE_KEY, 'hex');

  return { hash, signature };
}

module.exports = { createProof };
