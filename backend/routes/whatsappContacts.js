// routes/whatsappContacts.js

const express = require('express');
const multer  = require('multer');
const XLSX    = require('xlsx');
const pool    = require('../db');
const { authenticateToken, isAdmin, logAction } = require('../middleware');

const router  = express.Router();
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const VALID_CATEGORIES = ['VIP', 'Normal', 'New', 'Inactive', 'Custom'];

// ── GET /api/whatsapp-contacts/categories ──────────────────────────────────
router.get('/categories', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT DISTINCT
                CASE WHEN category = 'Custom' THEN custom_category ELSE category END AS label,
                category,
                custom_category,
                COUNT(*) AS contact_count
             FROM whatsapp_contacts
             GROUP BY category, custom_category
             ORDER BY label`
        );
        res.json({ success: true, categories: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── GET /api/whatsapp-contacts ─────────────────────────────────────────────
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { category } = req.query;
        let query  = 'SELECT * FROM whatsapp_contacts';
        const params = [];

        if (category) {
            if (category === 'Custom') {
                query += ' WHERE category = ?';
                params.push('Custom');
            } else if (VALID_CATEGORIES.includes(category)) {
                query += ' WHERE category = ?';
                params.push(category);
            } else {
                // treat as custom_category value
                query += ' WHERE category = ? AND custom_category = ?';
                params.push('Custom', category);
            }
        }

        query += ' ORDER BY created_at DESC';
        const [rows] = await pool.query(query, params);
        res.json({ success: true, contacts: rows, total: rows.length });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── POST /api/whatsapp-contacts/import ────────────────────────────────────
router.post('/import', authenticateToken, isAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

        const { category, custom_category } = req.body;
        if (!category || !VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ success: false, error: 'Invalid category' });
        }
        if (category === 'Custom' && !custom_category?.trim()) {
            return res.status(400).json({ success: false, error: 'custom_category required when category is Custom' });
        }

        // Parse Excel
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet    = workbook.Sheets[workbook.SheetNames[0]];
        const rows     = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rows.length) return res.status(400).json({ success: false, error: 'Excel file is empty' });

        // Normalise header names (case-insensitive)
        const normaliseRow = (row) => {
            const out = {};
            for (const [k, v] of Object.entries(row)) {
                out[k.toLowerCase().trim()] = String(v).trim();
            }
            return out;
        };

        let inserted = 0, skipped = 0, errors = [];

        for (const rawRow of rows) {
            const row   = normaliseRow(rawRow);
            const name  = row['name'] || row['اسم'] || '';
            let   phone = row['phone'] || row['هاتف'] || row['رقم'] || '';

            if (!phone) { skipped++; continue; }

            // Normalise phone: strip non-digits, remove leading 00 or 0
            phone = phone.replace(/\D/g, '');
            if (phone.startsWith('00')) phone = phone.slice(2);
            else if (phone.startsWith('0')) phone = phone.slice(1);

            if (phone.length < 7) { skipped++; continue; }

            try {
                await pool.query(
                    `INSERT IGNORE INTO whatsapp_contacts (name, phone, category, custom_category)
                     VALUES (?, ?, ?, ?)`,
                    [name, phone, category, category === 'Custom' ? custom_category.trim() : null]
                );
                inserted++;
            } catch (e) {
                errors.push(`${phone}: ${e.message}`);
                skipped++;
            }
        }

        await logAction(req, 'IMPORT', 'whatsapp_contacts', category,
            `Imported ${inserted} contacts (skipped ${skipped}) into category ${category}`);

        res.json({ success: true, inserted, skipped, errors });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── DELETE /api/whatsapp-contacts/:id ─────────────────────────────────────
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM whatsapp_contacts WHERE id = ?', [parseInt(id)]);
        await logAction(req, 'DELETE', 'whatsapp_contacts', id, `Deleted contact id ${id}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
