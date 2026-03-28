const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./veritas.db');

// create table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      message TEXT,
      normalized TEXT,
      hash TEXT,
      time INTEGER
    )
  `);
});

module.exports = db;
