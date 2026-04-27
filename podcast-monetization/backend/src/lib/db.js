const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../podmonetize.db');
const db = new Database(dbPath, { verbose: console.log });

// Initialize database tables
const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password_hash TEXT,
      podcast_name TEXT,
      tier TEXT DEFAULT 'starter',
      stripe_customer_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      podcast_data JSON,
      sponsors_matched JSON,
      pitches JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
};

initDb();

module.exports = db;
