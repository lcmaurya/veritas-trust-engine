const fs = require('fs');
const crypto = require('crypto');

const FILE = './chain.json';

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function loadChain() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE));
}

function saveChain(chain) {
  fs.writeFileSync(FILE, JSON.stringify(chain, null, 2));
}

function getLastHash() {
  const chain = loadChain();
  if (chain.length === 0) return "GENESIS";
  return chain[chain.length - 1].hash;
}

// 🔍 duplicate check
function existsHash(data_hash) {
  const chain = loadChain();
  return chain.some(b => b.data_hash === data_hash);
}

// 🔐 PRIVACY SAFE BLOCK
function addBlock(data) {

  const chain = loadChain();
  const prev = getLastHash();

  const data_hash = sha256(JSON.stringify(data));

  // ❌ duplicate रोकना
  if (existsHash(data_hash)) {
    return {
      skipped: true,
      reason: "DUPLICATE",
      data_hash: data_hash
    };
  }

  const block = {
    index: chain.length,
    timestamp: Date.now(),
    prev_hash: prev,
    data_hash: data_hash
  };

  block.hash = sha256(JSON.stringify(block));

  chain.push(block);
  saveChain(chain);

  return block;
}

module.exports = { addBlock, sha256, existsHash };
