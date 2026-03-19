// routes/banners.js

const express = require('express');
const pool    = require('../db');
const { authenticateToken, isAdmin, logAction } = require('../middleware');

const router = express.Router();

// GET /api/banners
router.get('/', async (req, res) => {
    try {
        const [banners] = await pool.query(
            'SELECT * FROM banners WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC'
        );
        res.json({ success: true, banners });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// POST /api/banners
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { title_en, title_ar, subtitle_en, subtitle_ar, btn_text_en, btn_text_ar,
                btn_link, image_url, bg_color, sort_order, is_active } = req.body;
        const [result] = await pool.query(
            `INSERT INTO banners (title_en, title_ar, subtitle_en, subtitle_ar, btn_text_en, btn_text_ar,
             btn_link, image_url, bg_color, sort_order, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title_en, title_ar, subtitle_en, subtitle_ar,
             btn_text_en || 'SHOP NOW', btn_text_ar || 'تسوق الآن',
             btn_link || '#', image_url || null,
             bg_color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
             sort_order || 0, is_active !== false ? 1 : 0]
        );
        await logAction(req, 'CREATE', 'banner', result.insertId, `Created banner: ${title_en || 'untitled'}`);
        res.status(201).json({ success: true, id: result.insertId });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// PUT /api/banners/:id
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { title_en, title_ar, subtitle_en, subtitle_ar, btn_text_en, btn_text_ar,
                btn_link, image_url, bg_color, sort_order, is_active } = req.body;
        await pool.query(
            `UPDATE banners SET title_en=?, title_ar=?, subtitle_en=?, subtitle_ar=?,
             btn_text_en=?, btn_text_ar=?, btn_link=?, image_url=?, bg_color=?,
             sort_order=?, is_active=? WHERE id=?`,
            [title_en, title_ar, subtitle_en, subtitle_ar,
             btn_text_en || 'SHOP NOW', btn_text_ar || 'تسوق الآن',
             btn_link || '#', image_url || null,
             bg_color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
             sort_order || 0, is_active ? 1 : 0, req.params.id]
        );
        await logAction(req, 'UPDATE', 'banner', req.params.id, `Updated banner ID: ${req.params.id}`);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// DELETE /api/banners/:id
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM banners WHERE id = ?', [req.params.id]);
        await logAction(req, 'DELETE', 'banner', req.params.id, `Deleted banner ID: ${req.params.id}`);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

module.exports = router;
