const fs = require('fs');
const crypto = require('crypto');

const FILE = './chain.json';

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function verifyChain() {

  if (!fs.existsSync(FILE)) {
    return { valid: true, message: "No chain found" };
  }

  const chain = JSON.parse(fs.readFileSync(FILE));

  for (let i = 0; i < chain.length; i++) {

    const block = chain[i];

    // 🔹 Recalculate hash
    const checkHash = sha256(JSON.stringify({
      index: block.index,
      timestamp: block.timestamp,
      prev_hash: block.prev_hash,
      data: block.data
    }));

    if (checkHash !== block.hash) {
      return {
        valid: false,
        error: "HASH TAMPERED",
        index: i
      };
    }

    // 🔹 Check link
    if (i > 0 && block.prev_hash !== chain[i - 1].hash) {
      return {
        valid: false,
        error: "CHAIN BROKEN",
        index: i
      };
    }
  }

  return { valid: true, length: chain.length };
}

module.exports = { verifyChain };
