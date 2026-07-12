const path = require('path');

async function init() {
  if (process.env.DATABASE_URL) {
    // Use Postgres
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false });

    // create tables if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS keys (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE,
        created_at BIGINT,
        active INTEGER DEFAULT 1,
        monthly_quota_seconds BIGINT DEFAULT 2592000,
        usage_seconds BIGINT DEFAULT 0,
        month_start BIGINT
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usage_events (
        id SERIAL PRIMARY KEY,
        key_id INTEGER REFERENCES keys(id),
        seconds BIGINT,
        ts BIGINT
      );
    `);

    return {
      run: async (sql, ...params) => {
        const res = await pool.query(sql, params);
        return res;
      },
      get: async (sql, ...params) => {
        const res = await pool.query(sql, params);
        return res.rows[0];
      },
      all: async (sql, ...params) => {
        const res = await pool.query(sql, params);
        return res.rows;
      }
    };
  } else {
    // Use SQLite fallback
    const sqlite3 = require('sqlite3');
    const { open } = require('sqlite');
    const db = await open({ filename: path.join(__dirname, 'licenses.db'), driver: sqlite3.Database });

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
}

module.exports = { init };
