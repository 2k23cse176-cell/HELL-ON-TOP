const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { nanoid } = require('nanoid');
const dbModule = require('./db');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

let db;

async function start() {
  db = await dbModule.init();

  app.get('/api/keys', async (req, res) => {
    const keys = await db.all('SELECT id,key,created_at,active,monthly_quota_seconds,usage_seconds,month_start FROM keys');
    res.json({ keys });
  });

  app.post('/api/keys/create', async (req, res) => {
    const { monthly_quota_seconds } = req.body || {};
    const key = nanoid(16);
    const ts = Date.now();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    await db.run(
      'INSERT INTO keys (key, created_at, monthly_quota_seconds, month_start) VALUES (?, ?, ?, ?)',
      key,
      ts,
      monthly_quota_seconds || 2592000,
      monthStart
    );
    res.json({ key });
  });

  app.post('/api/keys/validate', async (req, res) => {
    const { key } = req.body || {};
    if (!key) return res.status(400).json({ error: 'missing key' });
    const row = await db.get('SELECT * FROM keys WHERE key = ?', key);
    if (!row) return res.status(404).json({ valid: false });

    // reset month usage if month rolled
    const now = Date.now();
    const monthStartNow = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    if (!row.month_start || row.month_start < monthStartNow) {
      await db.run('UPDATE keys SET usage_seconds = 0, month_start = ? WHERE id = ?', monthStartNow, row.id);
      row.usage_seconds = 0;
      row.month_start = monthStartNow;
    }

    const allowed = !!row.active;
    res.json({ valid: allowed, usage_seconds: row.usage_seconds, monthly_quota_seconds: row.monthly_quota_seconds });
  });

  app.post('/api/usage/report', async (req, res) => {
    const { key, seconds } = req.body || {};
    if (!key || !seconds) return res.status(400).json({ error: 'missing key or seconds' });
    const row = await db.get('SELECT * FROM keys WHERE key = ?', key);
    if (!row) return res.status(404).json({ error: 'key not found' });

    const now = Date.now();
    const monthStartNow = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    if (!row.month_start || row.month_start < monthStartNow) {
      // reset month
      await db.run('UPDATE keys SET usage_seconds = 0, month_start = ? WHERE id = ?', monthStartNow, row.id);
      row.usage_seconds = 0;
    }

    const newUsage = row.usage_seconds + seconds;
    await db.run('INSERT INTO usage_events (key_id, seconds, ts) VALUES (?, ?, ?)', row.id, seconds, now);
    await db.run('UPDATE keys SET usage_seconds = ? WHERE id = ?', newUsage, row.id);

    // enforce quota: if exceeded, deactivate (but user requested not to auto-suspend across host changes — we still enforce if enabled later)
    if (newUsage >= row.monthly_quota_seconds) {
      await db.run('UPDATE keys SET active = 0 WHERE id = ?', row.id);
    }

    res.json({ ok: true, usage_seconds: newUsage });
  });

  app.post('/api/keys/suspend', async (req, res) => {
    const { key } = req.body || {};
    if (!key) return res.status(400).json({ error: 'missing key' });
    await db.run('UPDATE keys SET active = 0 WHERE key = ?', key);
    res.json({ ok: true });
  });

  app.post('/api/keys/resume', async (req, res) => {
    const { key } = req.body || {};
    if (!key) return res.status(400).json({ error: 'missing key' });
    await db.run('UPDATE keys SET active = 1 WHERE key = ?', key);
    res.json({ ok: true });
  });

  app.use(express.static(path.join(__dirname, 'public')));

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log('License server running on', port));
}

start().catch(err => { console.error(err); process.exit(1); });
