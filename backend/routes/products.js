// routes/products.js

const express = require('express');
const pool    = require('../db');
const { authenticateToken, isAdmin, logAction } = require('../middleware');

const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
    try {
        const { category, offer, topSeller, visible, search, limit, offset } = req.query;
        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];
        if (category)         { query += ' AND category_id = ?'; params.push(category); }
        if (offer === 'true')   query += ' AND is_offer = TRUE';
        if (topSeller === 'true') query += ' AND is_top_seller = TRUE';
        if (visible !== 'false')  query += ' AND is_visible = TRUE';
        if (search) {
            query += ' AND (name_en LIKE ? OR name_ar LIKE ? OR description_en LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        query += ' ORDER BY quantity_to_sell DESC';

        const pageLimit  = limit  ? parseInt(limit,  10) : null;
        const pageOffset = offset ? parseInt(offset, 10) : 0;
        if (pageLimit) {
            query += ' LIMIT ? OFFSET ?';
            params.push(pageLimit, pageOffset);
        }

        const [products] = await pool.query(query, params);
        res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
        res.json(products);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (products.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(products[0]);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /api/products
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name_en, name_ar, description_en, description_ar, category_id, cost_price,
            old_price, new_price, stock, quantity_to_sell, image_url, additional_images,
            video_url, is_offer, is_top_seller, is_visible, quantity_tiers } = req.body;
        const tiersValue = quantity_tiers
            ? (typeof quantity_tiers === 'string' ? quantity_tiers : JSON.stringify(quantity_tiers))
            : null;
        const [result] = await pool.query(
            `INSERT INTO products (name_en, name_ar, description_en, description_ar,
                category_id, cost_price, old_price, new_price, stock, quantity_to_sell,
                image_url, additional_images, video_url, is_offer, is_top_seller, is_visible, quantity_tiers)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name_en, name_ar, description_en, description_ar,
                category_id, cost_price || 0, old_price, new_price, stock, quantity_to_sell || 0,
                image_url, additional_images, video_url,
                is_offer || false, is_top_seller || false, is_visible !== false, tiersValue]
        );
        await logAction(req, 'CREATE', 'product', result.insertId, `Created product: ${name_en}`);
        res.status(201).json({ success: true, message: 'Product created', id: result.insertId });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/products/:id
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name_en, name_ar, description_en, description_ar, category_id, cost_price,
            old_price, new_price, stock, quantity_to_sell, image_url, additional_images,
            video_url, is_offer, is_top_seller, is_visible, quantity_tiers } = req.body;
        const tiersValue = quantity_tiers
            ? (typeof quantity_tiers === 'string' ? quantity_tiers : JSON.stringify(quantity_tiers))
            : null;
        await pool.query(
            `UPDATE products SET name_en=?, name_ar=?, description_en=?, description_ar=?,
                category_id=?, cost_price=?, old_price=?, new_price=?, stock=?, quantity_to_sell=?,
                image_url=?, additional_images=?, video_url=?, is_offer=?, is_top_seller=?, is_visible=?,
                quantity_tiers=?
             WHERE id=?`,
            [name_en, name_ar, description_en, description_ar,
                category_id, cost_price || 0, old_price, new_price, stock, quantity_to_sell || 0,
                image_url, additional_images, video_url,
                is_offer, is_top_seller, is_visible, tiersValue, req.params.id]
        );
        await logAction(req, 'UPDATE', 'product', req.params.id,
            `Updated product ID: ${req.params.id} → ${name_en}`);
        res.json({ success: true, message: 'Product updated' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// DELETE /api/products/:id
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        await logAction(req, 'DELETE', 'product', req.params.id,
            `Deleted product ID: ${req.params.id}`);
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

module.exports = router;
