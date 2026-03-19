// routes/reports.js

const express = require('express');
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware');

const router = express.Router();

// GET /api/reports/profit
router.get('/profit', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                o.id,
                o.order_id,
                o.total,
                o.delivery_city,
                SUM(oi.quantity * COALESCE(p.cost_price, 0))   AS total_cost_price,
                COALESCE(dc.actual_fee, 0)                      AS actual_delivery_fee
            FROM orders o
            LEFT JOIN order_items oi  ON oi.order_id  = o.id
            LEFT JOIN products p      ON p.id          = oi.product_id
            LEFT JOIN delivery_cities dc ON dc.city_name_en = o.delivery_city
            WHERE o.order_status = 'delivered'
            GROUP BY o.id, o.order_id, o.total, o.delivery_city, dc.actual_fee
        `);

        let totalRevenue = 0, totalCost = 0, totalDelivery = 0;
        rows.forEach(r => {
            totalRevenue  += parseFloat(r.total              || 0);
            totalCost     += parseFloat(r.total_cost_price   || 0);
            totalDelivery += parseFloat(r.actual_delivery_fee || 0);
        });

        res.json({
            success: true,
            summary: {
                orderCount:    rows.length,
                totalRevenue:  +totalRevenue.toFixed(2),
                totalCost:     +totalCost.toFixed(2),
                totalDelivery: +totalDelivery.toFixed(2),
                netProfit:     +(totalRevenue - totalCost - totalDelivery).toFixed(2)
            }
        });
    } catch (error) {
        console.error('Profit report error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
