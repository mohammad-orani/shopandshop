// routes/whatsappBroadcast.js

const express = require('express');
const pool    = require('../db');
const { authenticateToken, isAdmin, logAction } = require('../middleware');
const { broadcastMessage } = require('../utils/whatsapp');

const router = express.Router();

// ── POST /api/whatsapp/broadcast ──────────────────────────────────────────
router.post('/broadcast', authenticateToken, isAdmin, async (req, res) => {
    const { message, category, custom_category, numbers } = req.body;

    if (!message?.trim()) {
        return res.status(400).json({ success: false, error: 'message is required' });
    }

    let phoneList = [];

    if (Array.isArray(numbers) && numbers.length) {
        // Direct numbers array supplied
        phoneList = numbers;
    } else if (category) {
        // Fetch from whatsapp_contacts by category
        let q = 'SELECT phone FROM whatsapp_contacts WHERE category = ?';
        const params = [category];
        if (category === 'Custom' && custom_category) {
            q += ' AND custom_category = ?';
            params.push(custom_category);
        }
        try {
            const [rows] = await pool.query(q, params);
            phoneList = rows.map(r => r.phone);
        } catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    } else {
        return res.status(400).json({ success: false, error: 'category or numbers array is required' });
    }

    if (!phoneList.length) {
        return res.json({ success: true, results: { sent: 0, failed: 0, errors: [] }, message: 'No contacts found' });
    }

    const results = await broadcastMessage(phoneList, message.trim());

    // Log each send to DB
    for (const phone of phoneList) {
        const failed = results.errors.find(e => e.phone === phone);
        try {
            await pool.query(
                `INSERT INTO whatsapp_broadcast_log (phone, message, status, error_message)
                 VALUES (?, ?, ?, ?)`,
                [phone, message.trim(), failed ? 'failed' : 'sent', failed?.error || null]
            );
        } catch (_) {}
    }

    await logAction(req, 'BROADCAST', 'whatsapp', category || 'direct',
        `Broadcast to ${phoneList.length} contacts — sent: ${results.sent}, failed: ${results.failed}`);

    res.json({ success: true, results });
});

// ── GET /api/whatsapp/broadcast-log ──────────────────────────────────────
router.get('/broadcast-log', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { limit = 200, offset = 0 } = req.query;
        const [rows] = await pool.query(
            `SELECT * FROM whatsapp_broadcast_log ORDER BY sent_at DESC LIMIT ? OFFSET ?`,
            [parseInt(limit), parseInt(offset)]
        );
        const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM whatsapp_broadcast_log');
        res.json({ success: true, logs: rows, total });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── GET /api/whatsapp/contact-count ──────────────────────────────────────
router.get('/contact-count', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { category, custom_category } = req.query;
        let query  = 'SELECT COUNT(*) as total FROM whatsapp_contacts WHERE category = ?';
        const params = [category || 'Normal'];
        if (category === 'Custom' && custom_category) {
            query += ' AND custom_category = ?';
            params.push(custom_category);
        }
        const [[{ total }]] = await pool.query(query, params);
        res.json({ success: true, total });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
