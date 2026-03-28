const fs = require('fs');

const FILE = './identity_db.json';

function loadDB() {
  if (!fs.existsSync(FILE)) return {};
  return JSON.parse(fs.readFileSync(FILE));
}

function saveDB(db) {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

// 🔹 get identity
function getIdentity(hash) {
  const db = loadDB();
  return db[hash] || null;
}

// 🔹 check duplicate
function isDuplicate(hash) {
  const db = loadDB();
  return db[hash] ? true : false;
}

// 🔹 store full proof
function storeIdentity(hash, proof) {
  const db = loadDB();
  db[hash] = proof;
  saveDB(db);
}

module.exports = { getIdentity, isDuplicate, storeIdentity };
