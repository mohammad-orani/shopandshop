// routes/generalInfo.js

const express = require('express');
const pool    = require('../db');
const { authenticateToken, isAdmin, logAction } = require('../middleware');

const router = express.Router();

// GET /api/general-info
router.get('/', async (req, res) => {
    try {
        const [info] = await pool.query('SELECT * FROM general_info LIMIT 1');
        if (info.length === 0) return res.json({ success: false, message: 'No general info found' });
        const row = info[0];
        res.json({
            success: true,
            info: {
                brand_name:           row.gi_brand_name,
                phone_number:         row.gi_phone_number,
                email_address:        row.gi_email_address,
                minimum_order_amount: row.gi_minimum_order_amount,
                whatsapp:             row.gi_whatsapp      || '',
                instagram:            row.gi_instagram     || '',
                facebook:             row.gi_facebook      || '',
                snapchat:             row.gi_snapchat      || '',
                tiktok:               row.gi_tiktok        || '',
                youtube:              row.gi_youtube       || '',
                delivery_note:        row.gi_delivery_note || ''
            }
        });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// PUT /api/general-info
router.put('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const {
            brand_name, phone_number, email, email_address,
            whatsapp, instagram, facebook, snapchat, tiktok, youtube,
            free_delivery_min_amount, minimum_order_amount, delivery_note
        } = req.body;

        const emailVal = email || email_address || '';
        const minOrder = free_delivery_min_amount ?? minimum_order_amount ?? 0;

        const [existing] = await pool.query('SELECT * FROM general_info LIMIT 1');
        if (existing.length === 0) {
            await pool.query(
                `INSERT INTO general_info
                 (gi_brand_name, gi_phone_number, gi_email_address, gi_minimum_order_amount,
                  gi_whatsapp, gi_instagram, gi_facebook, gi_snapchat, gi_tiktok, gi_youtube, gi_delivery_note)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [brand_name, phone_number, emailVal, minOrder,
                 whatsapp||'', instagram||'', facebook||'', snapchat||'', tiktok||'', youtube||'', delivery_note||'']
            );
        } else {
            await pool.query(
                `UPDATE general_info SET
                 gi_brand_name=?, gi_phone_number=?, gi_email_address=?, gi_minimum_order_amount=?,
                 gi_whatsapp=?, gi_instagram=?, gi_facebook=?, gi_snapchat=?, gi_tiktok=?, gi_youtube=?, gi_delivery_note=?
                 WHERE gi_id=?`,
                [brand_name, phone_number, emailVal, minOrder,
                 whatsapp||'', instagram||'', facebook||'', snapchat||'', tiktok||'', youtube||'', delivery_note||'',
                 existing[0].gi_id]
            );
        }
        await logAction(req, 'UPDATE', 'general_info', 1, `Updated store general info`);
        res.json({ success: true, message: 'General info updated' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

module.exports = router;
