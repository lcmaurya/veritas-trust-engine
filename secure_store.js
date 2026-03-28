const fs = require('fs');
const crypto = require('crypto');

const FILE = './secure_db.json';

// 🔐 secret key (change later)
const SECRET = "my_super_secret_key_123";

// key generate
function getKey() {
  return crypto.createHash('sha256').update(SECRET).digest();
}

// encrypt
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', getKey(), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

// decrypt
function decrypt(data) {
  const parts = data.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];

  const decipher = crypto.createDecipheriv('aes-256-cbc', getKey(), iv);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// load DB
function loadDB() {
  if (!fs.existsSync(FILE)) return {};
  return JSON.parse(fs.readFileSync(FILE));
}

// save DB
function saveDB(db) {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

// store encrypted
function storeSecure(hash, data) {
  const db = loadDB();
  db[hash] = encrypt(JSON.stringify(data));
  saveDB(db);
}

// get decrypted
function getSecure(hash) {
  const db = loadDB();
  if (!db[hash]) return null;
  return JSON.parse(decrypt(db[hash]));
}

module.exports = { storeSecure, getSecure };
