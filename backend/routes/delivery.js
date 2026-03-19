// routes/delivery.js

const express = require('express');
const pool    = require('../db');
const { authenticateToken, isAdmin, logAction } = require('../middleware');

const router = express.Router();

// ============ COUNTRIES ============

// GET /api/delivery/countries
router.get('/countries', async (req, res) => {
    try {
        const [countries] = await pool.query(
            'SELECT * FROM delivery_countries WHERE is_active = TRUE ORDER BY country_name_en'
        );
        res.json({ success: true, countries });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// POST /api/delivery/countries
router.post('/countries', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name_en, name_ar, delivery_fee } = req.body;
        const [result] = await pool.query(
            'INSERT INTO delivery_countries (country_name_en, country_name_ar, default_fee, is_active) VALUES (?, ?, ?, TRUE)',
            [name_en, name_ar, parseFloat(delivery_fee) || 0]
        );
        await logAction(req, 'CREATE', 'delivery_country', result.insertId, `Created country: ${name_en}`);
        res.status(201).json({ success: true, id: result.insertId });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// PUT /api/delivery/countries/:id
router.put('/countries/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name_en, name_ar, delivery_fee } = req.body;
        await pool.query(
            'UPDATE delivery_countries SET country_name_en = ?, country_name_ar = ?, default_fee = ? WHERE id = ?',
            [name_en, name_ar, parseFloat(delivery_fee) || 0, req.params.id]
        );
        await logAction(req, 'UPDATE', 'delivery_country', req.params.id, `Updated country ID: ${req.params.id}`);
        res.json({ success: true, message: 'Country updated' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// DELETE /api/delivery/countries/:id
router.delete('/countries/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Cities are deleted via ON DELETE CASCADE in the schema
        await pool.query('DELETE FROM delivery_countries WHERE id = ?', [req.params.id]);
        await logAction(req, 'DELETE', 'delivery_country', req.params.id, `Deleted country ID: ${req.params.id}`);
        res.json({ success: true, message: 'Country deleted' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ============ CITIES ============

// GET /api/delivery/cities/:countryId
router.get('/cities/:countryId', async (req, res) => {
    try {
        const [cities] = await pool.query(
            'SELECT * FROM delivery_cities WHERE country_id = ? AND is_active = TRUE ORDER BY city_name_en',
            [req.params.countryId]
        );
        res.json({ success: true, cities });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// POST /api/delivery/cities
router.post('/cities', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { country_id, name_en, name_ar, displayed_fee, actual_fee } = req.body;
        const [result] = await pool.query(
            'INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, displayed_fee, actual_fee, is_active) VALUES (?, ?, ?, ?, ?, TRUE)',
            [country_id, name_en, name_ar, parseFloat(displayed_fee) || 0, parseFloat(actual_fee) || 0]
        );
        await logAction(req, 'CREATE', 'delivery_city', result.insertId, `Created city: ${name_en}`);
        res.status(201).json({ success: true, id: result.insertId });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// PUT /api/delivery/cities/:id
router.put('/cities/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name_en, name_ar, displayed_fee, actual_fee } = req.body;
        await pool.query(
            'UPDATE delivery_cities SET city_name_en = ?, city_name_ar = ?, displayed_fee = ?, actual_fee = ? WHERE id = ?',
            [name_en, name_ar, parseFloat(displayed_fee) || 0, parseFloat(actual_fee) || 0, req.params.id]
        );
        await logAction(req, 'UPDATE', 'delivery_city', req.params.id, `Updated city ID: ${req.params.id}`);
        res.json({ success: true, message: 'City updated' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// DELETE /api/delivery/cities/:id
router.delete('/cities/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM delivery_cities WHERE id = ?', [req.params.id]);
        await logAction(req, 'DELETE', 'delivery_city', req.params.id, `Deleted city ID: ${req.params.id}`);
        res.json({ success: true, message: 'City deleted' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

module.exports = router;
