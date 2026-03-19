// routes/stats.js

const express = require('express');
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware');

const router = express.Router();

// GET /api/stats
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [productCount] = await pool.query('SELECT COUNT(*) as count FROM products');
        const [orderCount]   = await pool.query('SELECT COUNT(*) as count FROM orders');
        const [revenue]      = await pool.query('SELECT SUM(total) as total FROM orders WHERE order_status = "completed"');
        const [pending]      = await pool.query('SELECT COUNT(*) as count FROM orders WHERE order_status = "pending"');
        res.json({
            total_products: productCount[0].count,
            total_orders:   orderCount[0].count,
            total_revenue:  revenue[0].total || 0,
            pending_orders: pending[0].count
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
