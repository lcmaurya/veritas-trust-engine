const {sha256} = require('./hashchain');
const {getSecure} = require('./secure_store');
const fs = require('fs');
const crypto = require('crypto');

const FILE = './chain.json';

// 🔐 same secret (must match combine.js)
const SECRET = process.env.ENGINE_SECRET;

function loadChain() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE));
}

// 🔐 decision hash
function hashDecision(decision) {
  return crypto
    .createHash('sha256')
    .update(String(decision))
    .digest('hex');
}

// 🔐 signature verify
function verifySignature(hash, signature) {
  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(hash)
    .digest('hex');

  return expected === signature;
}

// 🔍 verify by data
function verifyData(data) {

  const chain = loadChain();

  const hash = sha256(JSON.stringify(data));

  // 🔹 chain check
  const found = chain.find(b => b.data_hash === hash);

  if (!found) {
    return {
      valid: false,
      error: "NOT FOUND IN CHAIN"
    };
  }

  // 🔹 DB check
  const original = getSecure(hash);

  if (!original) {
    return {
      valid: false,
      error: "DATA NOT FOUND IN DB"
    };
  }

  // 🔹 data integrity
  if (JSON.stringify(original) !== JSON.stringify(data)) {
    return {
      valid: false,
      error: "DATA TAMPERED"
    };
  }

  // 🔹 decision integrity
  const expected_hash = hashDecision(data.risk);

  if (data.decision_hash !== expected_hash) {
    return {
      valid: false,
      error: "DECISION TAMPERED"
    };
  }

  // 🔥 FINAL: signature verify
  if (!verifySignature(data.decision_hash, data.decision_signature)) {
    return {
      valid: false,
      error: "SIGNATURE INVALID"
    };
  }

  return {
    valid: true,
    message: "VERIFIED",
    block: found
  };
}

module.exports = { verifyData };
