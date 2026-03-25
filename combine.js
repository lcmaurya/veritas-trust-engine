const {createProof} = require('./identity');
const {verifyProof} = require('./verify');
const {getIdentity, isDuplicate, storeIdentity} = require('./store');
const {addBlock} = require('./hashchain');
const {storeSecure} = require('./secure_store');
const crypto = require('crypto');

// 🔐 PRIVATE KEY (later secure store)
const SECRET = process.env.ENGINE_SECRET;

// 🔥 IMPORTANT: engine path
const engine = require('../veritas-engine-core-v1.1/index');

// 🔐 decision hash
function hashDecision(decision) {
  return crypto.createHash('sha256')
    .update(String(decision))
    .digest('hex');
}

// 🔐 signature
function signDecision(hash) {
  return crypto.createHmac('sha256', SECRET)
    .update(hash)
    .digest('hex');
}

async function run(name, dob, message) {

  const temp = createProof(name, dob);

  let proof;

  if (isDuplicate(temp.hash)) {
    proof = getIdentity(temp.hash);
  } else {
    proof = temp;
    storeIdentity(temp.hash, proof);
  }

  const valid = verifyProof(proof.hash, proof.signature);

  const result = await engine.decide(message);

  // 🔐 decision hash + signature
  const decision_hash = hashDecision(result.decision);
  const decision_signature = signDecision(decision_hash);

  const record = {
    name,
    dob,
    message,
    risk: result.decision,
    decision_hash,
    decision_signature
  };

  const block = addBlock(record);

  if (!block.skipped) {
    storeSecure(block.data_hash, record);
  }

  return {
    identity: valid ? "VERIFIED" : "FAKE",
    duplicate: isDuplicate(temp.hash),
    risk: result.decision,
    decision_hash,
    decision_signature,
    block
  };
}

module.exports = { run };
