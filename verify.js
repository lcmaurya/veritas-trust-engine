const crypto = require('crypto');
const fs = require('fs');

const PUBLIC_KEY = fs.readFileSync('./public.pem', 'utf8');

function verifyProof(hash, signature) {

  const verify = crypto.createVerify('SHA256');
  verify.update(hash);
  verify.end();

  return verify.verify(PUBLIC_KEY, signature, 'hex');
}

module.exports = { verifyProof };
