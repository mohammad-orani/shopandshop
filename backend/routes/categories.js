// routes/categories.js

const express = require('express');
const pool    = require('../db');
const { authenticateToken, isAdmin, logAction } = require('../middleware');

const router = express.Router();

// GET /api/categories
router.get('/', async (req, res) => {
    try {
        const showAll = req.query.visible === 'false';
        const query = showAll
            ? 'SELECT * FROM categories ORDER BY id'
            : 'SELECT * FROM categories WHERE is_visible = 1 ORDER BY name_en';
        const [categories] = await pool.query(query);
        res.json(categories);
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// POST /api/categories
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id, name_en, name_ar, is_visible = 1 } = req.body;
        await pool.query(
            'INSERT INTO categories (id, name_en, name_ar, is_visible) VALUES (?, ?, ?, ?)',
            [id, name_en, name_ar, is_visible ? 1 : 0]
        );
        await logAction(req, 'CREATE', 'category', id, `Created category: ${name_en} / ${name_ar}`);
        res.status(201).json({ success: true, message: 'Category created', id });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// PUT /api/categories/:id
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name_en, name_ar, is_visible } = req.body;
        await pool.query(
            'UPDATE categories SET name_en = ?, name_ar = ?, is_visible = ? WHERE id = ?',
            [name_en, name_ar, is_visible ? 1 : 0, req.params.id]
        );
        await logAction(req, 'UPDATE', 'category', req.params.id,
            `Updated category ID: ${req.params.id} → ${name_en}`);
        res.json({ success: true, message: 'Category updated' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// DELETE /api/categories/:id
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
        await logAction(req, 'DELETE', 'category', req.params.id,
            `Deleted category ID: ${req.params.id}`);
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

module.exports = router;
