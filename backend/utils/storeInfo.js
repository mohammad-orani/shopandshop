// backend/utils/storeInfo.js — shared store-identity lookup for server-generated
// messages (WhatsApp, email). Single source of truth: the general_info table,
// edited via the admin panel's General Info section. Falls back to the STORE_*
// environment variables only if the table has no row yet or the query fails,
// so a not-yet-configured database doesn't take notifications down entirely.

const pool = require('../db');

let _cache = null;
let _cacheTs = 0;
const _CACHE_TTL = 60 * 1000; // 1 minute — avoids a DB round-trip on every notification

async function getStoreInfo() {
    const now = Date.now();
    if (_cache && (now - _cacheTs) < _CACHE_TTL) return _cache;

    let info;
    try {
        const [rows] = await pool.query('SELECT gi_brand_name, gi_email_address FROM general_info LIMIT 1');
        const row = rows[0] || {};
        info = {
            name:  row.gi_brand_name    || process.env.STORE_NAME  || 'Store',
            email: row.gi_email_address || process.env.STORE_EMAIL || 'orders@example.com'
        };
    } catch (err) {
        console.warn('⚠️ general_info lookup failed, falling back to env vars:', err.message);
        info = {
            name:  process.env.STORE_NAME  || 'Store',
            email: process.env.STORE_EMAIL || 'orders@example.com'
        };
    }

    _cache = info;
    _cacheTs = now;
    return info;
}

module.exports = { getStoreInfo };