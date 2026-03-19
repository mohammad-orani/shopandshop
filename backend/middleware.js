// backend/middleware.js — Shared auth middleware and logging helper

const jwt  = require('jsonwebtoken');
const pool = require('./db');

const JWT_SECRET = process.env.JWT_SECRET; // validated in server.js before this is loaded

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'No token provided' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
};

async function logAction(req, action, entityType, entityId, details) {
    try {
        const user     = req.user || {};
        const userName = user.name || user.email || 'system';
        const userId   = user.userId || null;
        const ip       = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                      || req.socket?.remoteAddress
                      || req.ip
                      || 'unknown';
        await pool.query(
            `INSERT INTO admin_logs (user_id, user_name, action, entity_type, entity_id, details, ip_address)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, userName, action, entityType, String(entityId || ''), details || '', ip]
        );
    } catch (err) {
        console.warn('Log warning:', err.message);
    }
}

module.exports = { authenticateToken, isAdmin, logAction };
