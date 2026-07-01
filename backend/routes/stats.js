// routes/stats.js

const express = require('express');
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware');

const router = express.Router();

// GET /api/stats
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [[{ total_products }]] = await pool.query('SELECT COUNT(*) as total_products FROM products WHERE is_visible = 1');
        const [[{ total_orders }]]   = await pool.query('SELECT COUNT(*) as total_orders FROM orders');
        const [[{ pending_orders }]] = await pool.query("SELECT COUNT(*) as pending_orders FROM orders WHERE order_status = 'pending'");
        const [[{ delivered_orders }]] = await pool.query("SELECT COUNT(*) as delivered_orders FROM orders WHERE order_status = 'delivered'");
        const [[{ total_revenue }]]  = await pool.query("SELECT COALESCE(SUM(total), 0) as total_revenue FROM orders WHERE order_status = 'delivered'");
        res.json({
            total_products,
            total_orders,
            total_revenue:   parseFloat(total_revenue),
            pending_orders,
            delivered_orders
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
