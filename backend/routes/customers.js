// routes/customers.js — Customer authentication & profile
// Separate from admin auth — uses type:'customer' in JWT

const express   = require('express');
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool      = require('../db');

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many attempts, please try again later.' }
});

// ── Auto-migrate: create customers table + add customer_id to orders ──────────
async function ensureCustomerSchema() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS customers (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            name       VARCHAR(255) NOT NULL,
            email      VARCHAR(255) UNIQUE NOT NULL,
            phone      VARCHAR(50),
            password   VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
    try {
        await pool.query(`ALTER TABLE orders ADD COLUMN customer_id INT NULL REFERENCES customers(id)`);
    } catch (e) { /* column already exists */ }
    try {
        await pool.query(`ALTER TABLE orders ADD COLUMN payment_intent_id VARCHAR(255) NULL`);
    } catch (e) { /* column already exists */ }
    console.log('✅ Customers schema ready');
}
ensureCustomerSchema().catch(console.error);

// ── Middleware: authenticate customer JWT ─────────────────────────────────────
const authenticateCustomer = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'Access token required' });
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ success: false, error: 'Invalid or expired token' });
        if (decoded.type !== 'customer') {
            return res.status(403).json({ success: false, error: 'Customer token required' });
        }
        req.customer = decoded;
        next();
    });
};

// ── POST /api/customers/register ──────────────────────────────────────────────
router.post('/register', authLimiter, async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ success: false, error: 'Name, email and password are required' });
        if (password.length < 8)
            return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });

        const [existing] = await pool.query('SELECT id FROM customers WHERE email = ?', [email]);
        if (existing.length > 0)
            return res.status(409).json({ success: false, error: 'Email already registered' });

        const hashed = await bcrypt.hash(password, 12);
        const [result] = await pool.query(
            'INSERT INTO customers (name, email, phone, password) VALUES (?, ?, ?, ?)',
            [name.trim(), email.toLowerCase().trim(), phone || null, hashed]
        );

        const token = jwt.sign(
            { customerId: result.insertId, email: email.toLowerCase().trim(), name: name.trim(), type: 'customer' },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            success: true,
            token,
            customer: { id: result.insertId, name: name.trim(), email: email.toLowerCase().trim(), phone: phone || null }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, error: 'Registration failed: ' + error.message });
    }
});

// ── POST /api/customers/login ─────────────────────────────────────────────────
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ success: false, error: 'Email and password are required' });

        const [customers] = await pool.query(
            'SELECT id, name, email, phone, password FROM customers WHERE email = ?',
            [email.toLowerCase().trim()]
        );
        if (customers.length === 0)
            return res.status(401).json({ success: false, error: 'Invalid email or password' });

        const customer = customers[0];
        const match = await bcrypt.compare(password, customer.password);
        if (!match)
            return res.status(401).json({ success: false, error: 'Invalid email or password' });

        const token = jwt.sign(
            { customerId: customer.id, email: customer.email, name: customer.name, type: 'customer' },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token,
            customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Login failed: ' + error.message });
    }
});

// ── GET /api/customers/me ─────────────────────────────────────────────────────
router.get('/me', authenticateCustomer, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, name, email, phone, created_at FROM customers WHERE id = ?',
            [req.customer.customerId]
        );
        if (rows.length === 0)
            return res.status(404).json({ success: false, error: 'Customer not found' });
        res.json({ success: true, customer: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── PUT /api/customers/me ─────────────────────────────────────────────────────
router.put('/me', authenticateCustomer, async (req, res) => {
    try {
        const { name, phone } = req.body;
        await pool.query(
            'UPDATE customers SET name = ?, phone = ? WHERE id = ?',
            [name, phone || null, req.customer.customerId]
        );
        res.json({ success: true, message: 'Profile updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── PUT /api/customers/change-password ───────────────────────────────────────
router.put('/change-password', authenticateCustomer, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password)
            return res.status(400).json({ success: false, error: 'Both passwords are required' });
        if (new_password.length < 8)
            return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });

        const [rows] = await pool.query('SELECT password FROM customers WHERE id = ?', [req.customer.customerId]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Customer not found' });

        const match = await bcrypt.compare(current_password, rows[0].password);
        if (!match) return res.status(401).json({ success: false, error: 'Current password is incorrect' });

        const hashed = await bcrypt.hash(new_password, 12);
        await pool.query('UPDATE customers SET password = ? WHERE id = ?', [hashed, req.customer.customerId]);
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── GET /api/customers/orders ─────────────────────────────────────────────────
// Returns all orders belonging to the authenticated customer
router.get('/orders', authenticateCustomer, async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        const [orders] = await pool.query(
            `SELECT o.*
             FROM orders o
             WHERE o.customer_id = ? OR o.customer_email = ?
             ORDER BY o.created_at DESC
             LIMIT ? OFFSET ?`,
            [req.customer.customerId, req.customer.email, parseInt(limit), parseInt(offset)]
        );

        const result = await Promise.all(orders.map(async (order) => {
            const [items] = await pool.query(
                `SELECT oi.*, p.image_url
                 FROM order_items oi
                 LEFT JOIN products p ON p.id = oi.product_id
                 WHERE oi.order_id = ?`,
                [order.id]
            );
            return { ...order, items };
        }));

        res.json({ success: true, orders: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── GET /api/customers/orders/:orderId ────────────────────────────────────────
// Public order tracking by order_id string (ORD-xxx) + verification by phone or email
router.get('/track/:orderId', async (req, res) => {
    try {
        const { phone, email } = req.query;
        const { orderId } = req.params;

        let query = 'SELECT * FROM orders WHERE order_id = ?';
        const params = [orderId];
        if (phone) { query += ' AND customer_phone LIKE ?'; params.push(`%${phone.slice(-8)}%`); }
        else if (email) { query += ' AND customer_email = ?'; params.push(email.toLowerCase()); }
        else return res.status(400).json({ success: false, error: 'Phone or email required for tracking' });

        const [orders] = await pool.query(query, params);
        if (orders.length === 0)
            return res.status(404).json({ success: false, error: 'Order not found' });

        const order = orders[0];
        const [items] = await pool.query(
            `SELECT oi.*, p.image_url FROM order_items oi
             LEFT JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = ?`,
            [order.id]
        );

        res.json({ success: true, order: { ...order, items } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = { router, authenticateCustomer };
