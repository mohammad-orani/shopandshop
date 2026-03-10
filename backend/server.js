// backend/server.js - Main Express Server

const { notifyOrderStatusChange } = require('./notifications');
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: [
        'https://primejo.store',
        'https://www.primejo.store',
        'https://adminprimejo.netlify.app',
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        'http://localhost:3000'
    ]
}));
app.use(bodyParser.json());
app.use(express.static('public'));

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

console.log('Database Config:', {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
    password: dbConfig.password ? '***hidden***' : 'NOT SET'
});

const pool = mysql.createPool(dbConfig);
const JWT_SECRET = process.env.JWT_SECRET || 'primejo-secret-2026';

// ============ AUTO-MIGRATE ============

async function ensureOrdersColumns() {
    try {
        const [cols] = await pool.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'`
        );
        const existing = cols.map(c => c.COLUMN_NAME);
        const toAdd = [
            { name: 'displayed_shipping_cost', def: 'DECIMAL(10,2) DEFAULT 0' },
            { name: 'actual_shipping_cost', def: 'DECIMAL(10,2) DEFAULT 0' },
            { name: 'currency', def: "VARCHAR(10) DEFAULT 'JOD'" },
            { name: 'order_status', def: "VARCHAR(50) DEFAULT 'pending'" },
            { name: 'language', def: "VARCHAR(10) DEFAULT 'en'" },
        ];
        for (const col of toAdd) {
            if (!existing.includes(col.name)) {
                await pool.query(`ALTER TABLE orders ADD COLUMN \`${col.name}\` ${col.def}`);
                console.log(`Added column: orders.${col.name}`);
            }
        }
        console.log('Orders table columns verified');
    } catch (err) {
        console.warn('Migration warning:', err.message);
    }
}
ensureOrdersColumns();


// ============ ADMIN LOGS ============

async function logAction(req, action, entityType, entityId, details) {
    try {
        const user = req.user || {};
        const userName = user.name || user.email || 'system';
        const userId = user.userId || null;
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                || req.socket?.remoteAddress
                || req.ip
                || 'unknown';
        await pool.query(
            `INSERT INTO admin_logs (user_id, user_name, action, entity_type, entity_id, details, ip_address)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, userName, action, entityType, String(entityId || ''), details || '', ip]
        );
    } catch (err) {
        console.warn('Log warning:', err.message);
    }
}

async function ensureAdminLogsTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admin_logs (
                id          BIGINT AUTO_INCREMENT PRIMARY KEY,
                user_id     INT,
                user_name   VARCHAR(100),
                action      VARCHAR(50),
                entity_type VARCHAR(50),
                entity_id   VARCHAR(100),
                details     TEXT,
                ip_address  VARCHAR(60),
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_created (created_at),
                INDEX idx_user (user_name),
                INDEX idx_action (action)
            )
        `);
        console.log('admin_logs table ready');
    } catch (err) {
        console.warn('admin_logs migration warning:', err.message);
    }
}
ensureAdminLogsTable();

// ============ AUTH MIDDLEWARE ============

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'No token provided' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => next();

// ============ AUTH ============

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await pool.query('SELECT id, email, name, password FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ success: false, error: 'Invalid email or password' });
        const user = users[0];
        // Support both bcrypt hashes and legacy plain-text passwords
        const isHashed = user.password && user.password.startsWith('$2');
        const passwordMatch = isHashed
            ? await bcrypt.compare(password, user.password)
            : password === user.password;
        if (!passwordMatch) return res.status(401).json({ success: false, error: 'Invalid email or password' });
        const token = jwt.sign({ userId: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        // Log login — inject fake req.user so logAction can read it
        await logAction({ ...req, user: { userId: user.id, name: user.name || user.email } }, 'LOGIN', 'auth', user.id, `Logged in as ${user.email}`);
        res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name || user.email } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Login failed: ' + error.message });
    }
});

// POST /api/auth/change-password (PROTECTED)
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password)
            return res.status(400).json({ success: false, error: 'Both current and new password are required' });
        if (new_password.length < 8)
            return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });

        const [users] = await pool.query('SELECT id, password FROM users WHERE id = ?', [req.user.userId]);
        if (users.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

        const user = users[0];
        const isHashed = user.password && user.password.startsWith('$2');
        const passwordMatch = isHashed
            ? await bcrypt.compare(current_password, user.password)
            : current_password === user.password;

        if (!passwordMatch) return res.status(401).json({ success: false, error: 'Current password is incorrect' });

        const hashedNew = await bcrypt.hash(new_password, 12);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedNew, req.user.userId]);
        await logAction(req, 'PASSWORD_CHANGE', 'auth', req.user.userId, `Password changed for user ID: ${req.user.userId}`);

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to change password: ' + error.message });
    }
});

// ============ CATEGORIES ============

// GET 
app.get('/api/categories', async (req, res) => {
    try {
        const showAll = req.query.visible === 'false';
        const query = showAll
            ? 'SELECT * FROM categories ORDER BY id'
            : 'SELECT * FROM categories WHERE is_visible = 1 ORDER BY name_en';
        const [categories] = await pool.query(query);
        res.json(categories);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST
app.post('/api/categories', authenticateToken, isAdmin, async (req, res) => {
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

app.delete('/api/categories/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
        await logAction(req, 'DELETE', 'category', req.params.id, `Deleted category ID: ${req.params.id}`);
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// PUT — update
app.put('/api/categories/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name_en, name_ar, is_visible } = req.body;
        await pool.query(
            'UPDATE categories SET name_en = ?, name_ar = ?, is_visible = ? WHERE id = ?',
            [name_en, name_ar, is_visible ? 1 : 0, req.params.id]
        );
        await logAction(req, 'UPDATE', 'category', req.params.id, `Updated category ID: ${req.params.id} → ${name_en}`);
        res.json({ success: true, message: 'Category updated' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
// ============ PRODUCTS ============

app.get('/api/products', async (req, res) => {
    try {
        const { category, offer, topSeller, visible, search } = req.query;
        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];
        if (category) { query += ' AND category_id = ?'; params.push(category); }
        if (offer === 'true') query += ' AND is_offer = TRUE';
        if (topSeller === 'true') query += ' AND is_top_seller = TRUE';
        if (visible !== 'false') query += ' AND is_visible = TRUE';
        if (search) {
            query += ' AND (name_en LIKE ? OR name_ar LIKE ? OR description_en LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        query += ' ORDER BY quantity_to_sell DESC';
        const [products] = await pool.query(query, params);
        res.json(products);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (products.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(products[0]);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/products', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name_en, name_ar, description_en, description_ar, category_id, cost_price,
            old_price, new_price, stock, quantity_to_sell, image_url, additional_images,
            video_url, is_offer, is_top_seller, is_visible } = req.body;
        const [result] = await pool.query(
            `INSERT INTO products (name_en, name_ar, description_en, description_ar,
                category_id, cost_price, old_price, new_price, stock, quantity_to_sell,
                image_url, additional_images, video_url, is_offer, is_top_seller, is_visible)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name_en, name_ar, description_en, description_ar,
                category_id, cost_price || 0, old_price, new_price, stock, quantity_to_sell || 0,
                image_url, additional_images, video_url,
                is_offer || false, is_top_seller || false, is_visible !== false]
        );
        await logAction(req, 'CREATE', 'product', result.insertId, `Created product: ${name_en}`);
        res.status(201).json({ success: true, message: 'Product created', id: result.insertId });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name_en, name_ar, description_en, description_ar, category_id, cost_price,
            old_price, new_price, stock, quantity_to_sell, image_url, additional_images,
            video_url, is_offer, is_top_seller, is_visible } = req.body;
        await pool.query(
            `UPDATE products SET name_en=?, name_ar=?, description_en=?, description_ar=?,
                category_id=?, cost_price=?, old_price=?, new_price=?, stock=?, quantity_to_sell=?,
                image_url=?, additional_images=?, video_url=?, is_offer=?, is_top_seller=?, is_visible=?
             WHERE id=?`,
            [name_en, name_ar, description_en, description_ar,
                category_id, cost_price || 0, old_price, new_price, stock, quantity_to_sell || 0,
                image_url, additional_images, video_url,
                is_offer, is_top_seller, is_visible, req.params.id]
        );
        await logAction(req, 'UPDATE', 'product', req.params.id, `Updated product ID: ${req.params.id} → ${name_en}`);
        res.json({ success: true, message: 'Product updated' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.delete('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        await logAction(req, 'DELETE', 'product', req.params.id, `Deleted product ID: ${req.params.id}`);
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ============ ORDERS ============

// Helper: fetch items for one order by its numeric DB id
async function fetchOrderItems(dbId) {
    const [rows] = await pool.query(
        `SELECT
            oi.product_id,
            oi.quantity,
            oi.price,
            oi.total,
            COALESCE(p.name_en, oi.product_name_en, 'Unknown Product') AS product_name_en,
            COALESCE(p.name_ar, oi.product_name_ar, 'منتج غير معروف')  AS product_name_ar,
            p.image_url
         FROM order_items oi
         LEFT JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?`,
        [dbId]
    );
    return rows.map(r => ({
        product_id: r.product_id,
        productId: r.product_id,
        productName: r.product_name_en,
        productNameAr: r.product_name_ar,
        image_url: r.image_url || '',
        quantity: r.quantity,
        price: parseFloat(r.price || 0),
        total: parseFloat(r.total || 0)
    }));
}

// POST /api/orders  (PUBLIC)
app.post('/api/orders', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            order_id: clientOrderId,
            customer_name, customer_phone, customer_email,
            delivery_country, delivery_city,
            delivery_street, delivery_building, delivery_floor,
            delivery_address, order_notes,
            payment_method,
            delivery_fee, actual_delivery_fee, shipping_fee,
            items, subtotal, total, currency, language, order_status
        } = req.body;

        const order_id = clientOrderId || ('ORD-' + Date.now());
        const displayedFee = parseFloat(delivery_fee ?? shipping_fee ?? 0);
        const actualFee = parseFloat(actual_delivery_fee ?? displayedFee ?? 0);

        const [orderResult] = await connection.query(
            `INSERT INTO orders (
                order_id,
                customer_name, customer_phone, customer_email,
                delivery_country, delivery_city,
                delivery_street, delivery_building, delivery_floor,
                delivery_address, order_notes,
                payment_method, payment_status, order_status,
                currency, subtotal, displayed_shipping_cost, actual_shipping_cost,
                total, language
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                order_id,
                customer_name || '', customer_phone || '', customer_email || '',
                delivery_country || '', delivery_city || '',
                delivery_street || '', delivery_building || '', delivery_floor || '',
                delivery_address || '', order_notes || '',
                payment_method || 'cash', 'pending', order_status || 'pending',
                currency || 'JOD', subtotal || 0, displayedFee, actualFee,
                total || 0, language || 'en'
            ]
        );

        const dbOrderId = orderResult.insertId;

        for (const item of (items || [])) {
            await connection.query(
                `INSERT INTO order_items (order_id, product_id, product_name_en, product_name_ar, quantity, price, total)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [dbOrderId, parseInt(item.productId), item.productName || '', item.productNameAr || '', item.quantity, item.price, item.total]
            );
        }
        // Reduce stock
        for (const item of (items || [])) {
            if (item.productId) {
                await connection.query(
                    `UPDATE products 
             SET stock = GREATEST(0, stock - ?),
                 quantity_to_sell = GREATEST(0, quantity_to_sell - ?)
             WHERE id = ?`,
                    [item.quantity, item.quantity, parseInt(item.productId)]
                );
            }
        }
        await connection.commit();
        console.log(`Order created: ${order_id} | db id: ${dbOrderId} | ${(items || []).length} items`);
        res.status(201).json({ success: true, message: 'Order created successfully', order_id });

    } catch (error) {
        await connection.rollback();
        console.error('Create order error:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
});

// GET /api/orders  (PROTECTED) - returns all orders each with items[]
app.get('/api/orders', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { status, from_date, to_date } = req.query;

        let query = 'SELECT * FROM orders WHERE 1=1';
        const params = [];
        if (status) { query += ' AND order_status = ?'; params.push(status); }
        if (from_date) { query += ' AND created_at >= ?'; params.push(from_date); }
        if (to_date) { query += ' AND created_at <= ?'; params.push(to_date); }
        query += ' ORDER BY created_at DESC';

        const [orders] = await pool.query(query, params);
        if (orders.length === 0) return res.json([]);

        // Build IN clause manually — avoids mysql2 array-wrapping issue with IN(?)
        const orderIds = orders.map(o => o.id);
        const placeholders = orderIds.map(() => '?').join(',');

        const [items] = await pool.query(
            `SELECT
                oi.order_id,
                oi.product_id,
                oi.quantity,
                oi.price,
                oi.total,
                COALESCE(p.name_en, oi.product_name_en, 'Unknown Product') AS product_name,
                COALESCE(p.name_ar, oi.product_name_ar, 'منتج غير معروف')  AS product_name_ar,
                p.image_url
             FROM order_items oi
             LEFT JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id IN (${placeholders})`,
            orderIds
        );

        console.log(`Loaded ${items.length} items for ${orders.length} orders`);

        // Group by numeric order id
        const itemsByOrder = {};
        items.forEach(item => {
            if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
            itemsByOrder[item.order_id].push({
                product_id: item.product_id,
                productId: item.product_id,
                productName: item.product_name,
                productNameAr: item.product_name_ar,
                image_url: item.image_url || '',
                quantity: item.quantity,
                price: parseFloat(item.price || 0),
                total: parseFloat(item.total || 0)
            });
        });

        res.json(orders.map(order => ({
            ...order,
            items: itemsByOrder[order.id] || []
        })));

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/orders/:id  (PROTECTED) - single order with items
app.get('/api/orders/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const param = req.params.id;
        let orders;

        if (/^\d+$/.test(param)) {
            // Numeric — could be DB id or order_id string that happens to be numeric
            [orders] = await pool.query(
                'SELECT * FROM orders WHERE id = ? OR order_id = ? LIMIT 1',
                [parseInt(param, 10), param]
            );
        } else {
            // String like "ORD-1771971035880" — match order_id column only
            [orders] = await pool.query(
                'SELECT * FROM orders WHERE order_id = ? LIMIT 1',
                [param]
            );
        }

        if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });

        const order = orders[0];
        const items = await fetchOrderItems(order.id);

        console.log(`Order ${order.order_id} (id:${order.id}): ${items.length} items`);
        res.json({ ...order, items });

    } catch (error) {
        console.error('Get single order error:', error);
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/orders/:id/status
app.patch('/api/orders/:id/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { order_status } = req.body;
        const param = req.params.id;

        if (/^\d+$/.test(param)) {
            await pool.query('UPDATE orders SET order_status = ? WHERE id = ?', [order_status, parseInt(param)]);
        } else {
            await pool.query('UPDATE orders SET order_status = ? WHERE order_id = ?', [order_status, param]);
        }

        // Fetch order and send notification
        const [[order]] = await pool.query(
            'SELECT * FROM orders WHERE order_id = ? OR id = ? LIMIT 1',
            [param, parseInt(param) || 0]
        );
        if (order) await notifyOrderStatusChange(order, order_status);

        await logAction(req, 'STATUS_CHANGE', 'order', param, `Order ${param} → ${order_status}`);
        res.json({ success: true, message: 'Order status updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// PATCH /api/orders/:id/refund
app.patch('/api/orders/:id/refund', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { refund_reason } = req.body;
        const param = req.params.id;
        if (!refund_reason || !refund_reason.trim())
            return res.status(400).json({ success: false, error: 'Refund reason is required' });

        if (/^d+$/.test(param)) {
            await pool.query(
                'UPDATE orders SET order_status = ?, order_notes = ? WHERE id = ?',
                ['refunded', refund_reason.trim(), parseInt(param)]
            );
        } else {
            await pool.query(
                'UPDATE orders SET order_status = ?, order_notes = ? WHERE order_id = ?',
                ['refunded', refund_reason.trim(), param]
            );
        }

        const [[order]] = await pool.query(
            'SELECT * FROM orders WHERE order_id = ? OR id = ? LIMIT 1',
            [param, parseInt(param) || 0]
        );
        if (order) await notifyOrderStatusChange(order, 'refunded');
        await logAction(req, 'REFUND', 'order', param, `Order ${param} refunded — reason: ${refund_reason.trim()}`);

        res.json({ success: true, message: 'Order marked as refunded' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ DELIVERY ============

app.get('/api/delivery/countries', async (req, res) => {
    try {
        const [countries] = await pool.query(
            'SELECT * FROM delivery_countries WHERE is_active = TRUE ORDER BY country_name_en'
        );
        res.json({ success: true, countries });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/delivery/cities/:countryId', async (req, res) => {
    try {
        const [cities] = await pool.query(
            'SELECT * FROM delivery_cities WHERE country_id = ? AND is_active = TRUE ORDER BY city_name_en',
            [req.params.countryId]
        );
        res.json({ success: true, cities });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ============ GENERAL INFO ============

app.get('/api/general-info', async (req, res) => {
    try {
        const [info] = await pool.query('SELECT * FROM general_info LIMIT 1');
        if (info.length === 0) return res.json({ success: false, message: 'No general info found' });
        res.json({
            success: true,
            info: {
                brand_name: info[0].gi_brand_name,
                phone_number: info[0].gi_phone_number,
                email_address: info[0].gi_email_address,
                minimum_order_amount: info[0].gi_minimum_order_amount
            }
        });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/general-info', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { brand_name, phone_number, email_address, minimum_order_amount } = req.body;
        const [existing] = await pool.query('SELECT * FROM general_info LIMIT 1');
        if (existing.length === 0) {
            await pool.query(
                'INSERT INTO general_info (gi_brand_name, gi_phone_number, gi_email_address, gi_minimum_order_amount) VALUES (?, ?, ?, ?)',
                [brand_name, phone_number, email_address, minimum_order_amount]
            );
        } else {
            await pool.query(
                'UPDATE general_info SET gi_brand_name=?, gi_phone_number=?, gi_email_address=?, gi_minimum_order_amount=? WHERE gi_id=?',
                [brand_name, phone_number, email_address, minimum_order_amount, existing[0].gi_id]
            );
        }
        await logAction(req, 'UPDATE', 'general_info', 1, `Updated store general info`);
        res.json({ success: true, message: 'General info updated' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ============ STATS ============

app.get('/api/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [productCount] = await pool.query('SELECT COUNT(*) as count FROM products');
        const [orderCount] = await pool.query('SELECT COUNT(*) as count FROM orders');
        const [revenue] = await pool.query('SELECT SUM(total) as total FROM orders WHERE order_status = "completed"');
        const [pending] = await pool.query('SELECT COUNT(*) as count FROM orders WHERE order_status = "pending"');
        res.json({
            total_products: productCount[0].count,
            total_orders: orderCount[0].count,
            total_revenue: revenue[0].total || 0,
            pending_orders: pending[0].count
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});
// ============ BANNERS ============

app.get('/api/banners', async (req, res) => {
    try {
        const [banners] = await pool.query(
            'SELECT * FROM banners WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC'
        );
        res.json({ success: true, banners });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/banners', authenticateToken, isAdmin, async (req, res) => {
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

app.put('/api/banners/:id', authenticateToken, isAdmin, async (req, res) => {
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

app.delete('/api/banners/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM banners WHERE id = ?', [req.params.id]);
        await logAction(req, 'DELETE', 'banner', req.params.id, `Deleted banner ID: ${req.params.id}`);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// GET /api/admin-logs (PROTECTED)
app.get('/api/admin-logs', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { action, user, limit = 200, offset = 0 } = req.query;
        let query = 'SELECT * FROM admin_logs WHERE 1=1';
        const params = [];
        if (action) { query += ' AND action = ?'; params.push(action); }
        if (user)   { query += ' AND user_name LIKE ?'; params.push(`%${user}%`); }
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        const [logs] = await pool.query(query, params);
        const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM admin_logs');
        res.json({ success: true, logs, total });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ START ============

app.listen(PORT, () => {
    console.log(`Primejo API running on port ${PORT}`);
    console.log(`Database: ${dbConfig.database} @ ${dbConfig.host}`);
});

module.exports = app;