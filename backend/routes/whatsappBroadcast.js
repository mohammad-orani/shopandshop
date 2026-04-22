// routes/whatsappBroadcast.js

const express = require('express');
const pool    = require('../db');
const { authenticateToken, isAdmin, logAction } = require('../middleware');
const { sendTextMessage, sendTemplateMessage, sleep } = require('../utils/whatsappSender');

const router = express.Router();
const RATE_LIMIT_MS = 500; // 500ms between each send

// ── POST /api/whatsapp/broadcast ──────────────────────────────────────────
router.post('/broadcast', authenticateToken, isAdmin, async (req, res) => {
    const { message, category, custom_category, template_mode, template_name, lang_code } = req.body;

    if (!category) return res.status(400).json({ success: false, error: 'category is required' });
    if (!template_mode && !message?.trim()) {
        return res.status(400).json({ success: false, error: 'message is required for text mode' });
    }
    if (template_mode && !template_name?.trim()) {
        return res.status(400).json({ success: false, error: 'template_name is required for template mode' });
    }

    // Fetch contacts for the given category
    let contactQuery = 'SELECT id, phone FROM whatsapp_contacts WHERE category = ?';
    const params = [category];
    if (category === 'Custom' && custom_category) {
        contactQuery += ' AND custom_category = ?';
        params.push(custom_category);
    }

    let contacts;
    try {
        [contacts] = await pool.query(contactQuery, params);
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }

    if (!contacts.length) {
        return res.json({ success: true, sent: 0, failed: 0, errors: [], message: 'No contacts in this category' });
    }

    // Stream-friendly: respond early isn't possible here since we need final stats.
    // For large lists the client shows a loading state; we process synchronously.
    let sent = 0, failed = 0;
    const errors = [];

    for (const contact of contacts) {
        let result;
        if (template_mode) {
            result = await sendTemplateMessage(contact.phone, template_name.trim(), lang_code || 'ar');
        } else {
            result = await sendTextMessage(contact.phone, message.trim());
        }

        const status = result.success ? 'sent' : 'failed';
        if (result.success) {
            sent++;
        } else {
            failed++;
            errors.push({ phone: contact.phone, error: result.error });
        }

        // Log to DB
        try {
            await pool.query(
                `INSERT INTO whatsapp_broadcast_log (contact_id, phone, message, status, error_message)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    contact.id,
                    contact.phone,
                    template_mode ? `[TEMPLATE] ${template_name}` : message.trim(),
                    status,
                    result.error || null
                ]
            );
        } catch (logErr) {
            console.warn('Broadcast log insert failed:', logErr.message);
        }

        await sleep(RATE_LIMIT_MS);
    }

    await logAction(req, 'BROADCAST', 'whatsapp', category,
        `Broadcast to ${contacts.length} contacts — sent: ${sent}, failed: ${failed}`);

    res.json({ success: true, sent, failed, total: contacts.length, errors });
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
// Returns count of contacts matching a category (for the "X contacts" badge in UI)
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
