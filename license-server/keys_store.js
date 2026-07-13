const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
function generateKey(len = 16) { return crypto.randomBytes(Math.ceil(len/2)).toString('hex').slice(0, len); }

function now() { return Date.now(); }

class KeysStore {
  constructor() {
    this.mode = null; // 'env' | 'file' | null
    this.keys = []; // array of { key, created_at, active, monthly_quota_seconds, usage_seconds, month_start }
    if (process.env.LICENSE_KEYS) {
      try {
        const parsed = JSON.parse(process.env.LICENSE_KEYS);
        if (Array.isArray(parsed)) { this.keys = parsed; this.mode = 'env'; }
      } catch (e) {
        console.warn('LICENSE_KEYS is not valid JSON array');
      }
    }
    // If a KEYS_FILE is provided, use it. Otherwise default to a local keys.json file
    if (!this.mode) {
      this.file = path.resolve(process.env.KEYS_FILE || path.join(process.cwd(), 'keys.json'));
      this.mode = 'file';
      try {
        if (fs.existsSync(this.file)) {
          const raw = fs.readFileSync(this.file, 'utf8');
          this.keys = JSON.parse(raw || '[]');
        } else {
          this.keys = [];
          fs.writeFileSync(this.file, JSON.stringify(this.keys, null, 2));
        }
      } catch (e) {
        console.error('Failed to read or create keys file', e);
        this.keys = [];
      }
    }
  }

  enabled() { return !!this.mode; }

  all() { return this.keys; }

  getByKey(key) { return this.keys.find(k => k.key === key); }

  async delete(key) {
    const idx = this.keys.findIndex(k => k.key === key);
    if (idx === -1) return false;
    this.keys.splice(idx, 1);
    await this._persist();
    return true;
  }

  async claim(key, clientId) {
    const k = this.getByKey(key);
    if (!k) return { ok: false, error: 'not_found' };
    if (!k.bound_to) {
      k.bound_to = clientId;
      await this._persist();
      return { ok: true, bound: clientId };
    }
    if (k.bound_to === clientId) return { ok: true, bound: clientId };
    return { ok: false, error: 'already_bound', bound: k.bound_to };
  }

  async unclaim(key, clientId) {
    const k = this.getByKey(key);
    if (!k) return { ok: false, error: 'not_found' };
    if (!k.bound_to) return { ok: true };
    if (k.bound_to === clientId) {
      delete k.bound_to;
      await this._persist();
      return { ok: true };
    }
    return { ok: false, error: 'bound_to_other', bound: k.bound_to };
  }

  async create({ monthly_quota_seconds } = {}) {
    const key = generateKey(16);
    const ts = now();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    // Treat 0 as unlimited (no quota). Default is 2592000 seconds (30 days) if not provided.
    const quota = (typeof monthly_quota_seconds === 'number') ? monthly_quota_seconds : 2592000;
    const obj = { key, created_at: ts, active: 1, monthly_quota_seconds: quota, usage_seconds: 0, month_start: monthStart };
    this.keys.push(obj);
    await this._persist();
    return obj;
  }

  async addUsage(key, seconds) {
    const k = this.getByKey(key);
    if (!k) return null;
    const monthStartNow = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    if (!k.month_start || k.month_start < monthStartNow) { k.usage_seconds = 0; k.month_start = monthStartNow; }
    k.usage_seconds = (k.usage_seconds || 0) + Number(seconds || 0);
    // If monthly_quota_seconds is 0 => unlimited, do not auto-disable
    if (k.monthly_quota_seconds > 0 && k.usage_seconds >= k.monthly_quota_seconds) k.active = 0;
    await this._persist();
    return k;
  }

  async setActive(key, val) {
    const k = this.getByKey(key);
    if (!k) return null;
    k.active = val ? 1 : 0;
    await this._persist();
    return k;
  }

  async _persist() {
    if (this.mode === 'file') {
      try { fs.writeFileSync(this.file, JSON.stringify(this.keys, null, 2)); } catch (e) { console.error('Failed to persist keys file', e); }
    } else {
      // env mode: cannot persist back to environment; do nothing
    }
  }
}

module.exports = new KeysStore();
