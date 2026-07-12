const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function init() {
  const db = await open({
    filename: path.join(__dirname, 'licenses.db'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE,
      created_at INTEGER,
      active INTEGER DEFAULT 1,
      monthly_quota_seconds INTEGER DEFAULT 2592000,
      usage_seconds INTEGER DEFAULT 0,
      month_start INTEGER
    );

    CREATE TABLE IF NOT EXISTS usage_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_id INTEGER,
      seconds INTEGER,
      ts INTEGER,
      FOREIGN KEY(key_id) REFERENCES keys(id)
    );
  `);

  return db;
}

module.exports = { init };
