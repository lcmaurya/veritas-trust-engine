const crypto = require('crypto');

// 🔐 ENV KEY (Render + local दोनों में काम करेगा)
const SECRET = process.env.ENGINE_SECRET || "dev_fallback_key";

// 🔹 hash
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// 🔹 HMAC sign (file नहीं, key से)
function sign(data) {
  return crypto
    .createHmac('sha256', SECRET)
    .update(data)
    .digest('hex');
}

// 🔹 proof create
function createProof(name, dob) {

  const hash = sha256(name + dob);

  const signature = sign(hash);

  return { hash, signature };
}

module.exports = { createProof };
