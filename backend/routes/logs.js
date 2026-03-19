// routes/logs.js

const express = require('express');
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware');

const router = express.Router();

// GET /api/admin-logs
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { action, user, limit = 200, offset = 0 } = req.query;
        let query = 'SELECT * FROM admin_logs WHERE 1=1';
        const params = [];
        if (action) { query += ' AND action = ?';        params.push(action); }
        if (user)   { query += ' AND user_name LIKE ?';  params.push(`%${user}%`); }
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        const [logs] = await pool.query(query, params);
        const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM admin_logs');
        res.json({ success: true, logs, total });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
