// backend/server.js - Main Express Server
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Database configuration
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

// Log database config on startup
console.log('Database Config:', {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
    password: dbConfig.password ? '***hidden***' : 'NOT SET'
});

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'primejo-secret-2026';

// ============ AUTHENTICATION MIDDLEWARE ============

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'No token provided' 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                error: 'Invalid or expired token' 
            });
        }
        req.user = user;
        next();
    });
};

// Admin check (optional - checks if user has admin role)
const isAdmin = (req, res, next) => {
    // For now, anyone with a valid token is admin
    // Later you can add: if (req.user.role !== 'admin') return res.status(403)...
    next();
};

// ============ AUTH ENDPOINTS ============

// Login endpoint (PLAIN TEXT PASSWORD - for testing only!)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Login attempt:', email);

        // Query user from database
        const [users] = await pool.query(
            'SELECT id, email, name, password FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid email or password' 
            });
        }

        const user = users[0];

        // Plain text password comparison (NOT secure - for testing only!)
        if (password !== user.password) {
            console.log('❌ Password mismatch for:', email);
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid email or password' 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email,
                name: user.name 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ Login successful:', email);

        res.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name || user.email
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Login failed: ' + error.message 
        });
    }
});

// ============ CATEGORIES ENDPOINTS ============

// Get all categories (PUBLIC)
app.get('/api/categories', async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT * FROM categories ORDER BY name_en');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add category (PROTECTED)
app.post('/api/categories', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id, name_en, name_ar } = req.body;
        const [result] = await pool.query(
            'INSERT INTO categories (id, name_en, name_ar) VALUES (?, ?, ?)',
            [id, name_en, name_ar]
        );
        res.status(201).json({ success: true, message: 'Category created', id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete category (PROTECTED)
app.delete('/api/categories/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ PRODUCTS ENDPOINTS ============

// Get all products (PUBLIC with filters)
app.get('/api/products', async (req, res) => {
    try {
        const { category, offer, topSeller, visible, search } = req.query;

        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (category) {
            query += ' AND category_id = ?';
            params.push(category);
        }
        if (offer === 'true') {
            query += ' AND is_offer = TRUE';
        }
        if (topSeller === 'true') {
            query += ' AND is_top_seller = TRUE';
        }
        if (visible !== 'false') {
            query += ' AND is_visible = TRUE';
        }
        if (search) {
            query += ' AND (name_en LIKE ? OR name_ar LIKE ? OR description_en LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY created_at DESC';

        const [products] = await pool.query(query, params);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single product (PUBLIC)
app.get('/api/products/:id', async (req, res) => {
    try {
        const [products] = await pool.query(
            'SELECT * FROM products WHERE id = ?',
            [req.params.id]
        );
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ success: true, product: products[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create product (PROTECTED)
app.post('/api/products', authenticateToken, isAdmin, async (req, res) => {
    try {
        const {
            name_en, name_ar, description_en, description_ar,
            category_id, cost_price, old_price, new_price, stock, quantity_to_sell,
            image_url, additional_images, video_url,
            is_offer, is_top_seller, is_visible
        } = req.body;

        const [result] = await pool.query(
            `INSERT INTO products (
                name_en, name_ar, description_en, description_ar,
                category_id, cost_price, old_price, new_price, stock, quantity_to_sell,
                image_url, additional_images, video_url,
                is_offer, is_top_seller, is_visible
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name_en, name_ar, description_en, description_ar,
                category_id, cost_price || 0, old_price, new_price, stock, quantity_to_sell || 0,
                image_url, JSON.stringify(additional_images || []), video_url,
                is_offer || false, is_top_seller || false, is_visible !== false
            ]
        );

        res.status(201).json({ success: true, message: 'Product created', id: result.insertId });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update product (PROTECTED)
app.put('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const {
            name_en, name_ar, description_en, description_ar,
            category_id, cost_price, old_price, new_price, stock, quantity_to_sell,
            image_url, additional_images, video_url,
            is_offer, is_top_seller, is_visible
        } = req.body;

        await pool.query(
            `UPDATE products SET
                name_en=?, name_ar=?, description_en=?, description_ar=?,
                category_id=?, cost_price=?, old_price=?, new_price=?, stock=?, quantity_to_sell=?,
                image_url=?, additional_images=?, video_url=?,
                is_offer=?, is_top_seller=?, is_visible=?
            WHERE id=?`,
            [
                name_en, name_ar, description_en, description_ar,
                category_id, cost_price || 0, old_price, new_price, stock, quantity_to_sell || 0,
                image_url, JSON.stringify(additional_images || []), video_url,
                is_offer, is_top_seller, is_visible,
                req.params.id
            ]
        );

        res.json({ success: true, message: 'Product updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete product (PROTECTED)
app.delete('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ ORDERS ENDPOINTS ============

// Create order (PUBLIC)
app.post('/api/orders', async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const {
            customer_name, customer_phone, customer_email,
            delivery_country, delivery_city, complete_address,
            order_notes, payment_method,
            delivery_fee, actual_delivery_fee,
            items, subtotal, total, currency
        } = req.body;

        const order_id = 'ORD-' + Date.now();

        // Insert order
        const [orderResult] = await connection.query(
            `INSERT INTO orders (
                order_id, customer_name, customer_phone, customer_email,
                delivery_country, delivery_city, complete_address, order_notes, payment_method,
                subtotal, delivery_fee, actual_delivery_fee, total, currency
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                order_id, customer_name, customer_phone, customer_email,
                delivery_country, delivery_city, complete_address, order_notes, payment_method,
                subtotal, delivery_fee || 0, actual_delivery_fee || 0, total, currency || 'USD'
            ]
        );

        const orderId = orderResult.insertId;

        // Insert order items
        for (const item of items) {
            await connection.query(
                `INSERT INTO order_items (
                    order_id, product_id, product_name, quantity, price, total
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    orderId, item.productId, item.productName, 
                    item.quantity, item.price, item.total
                ]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order_id: order_id
        });
    } catch (error) {
        await connection.rollback();
        console.error('Create order error:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
});

// Get all orders (PROTECTED)
app.get('/api/orders', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { status, from_date, to_date } = req.query;

        let query = 'SELECT * FROM orders WHERE 1=1';
        const params = [];

        if (status) {
            query += ' AND order_status = ?';
            params.push(status);
        }
        if (from_date) {
            query += ' AND created_at >= ?';
            params.push(from_date);
        }
        if (to_date) {
            query += ' AND created_at <= ?';
            params.push(to_date);
        }

        query += ' ORDER BY created_at DESC';

        const [orders] = await pool.query(query, params);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update order status (PROTECTED)
app.patch('/api/orders/:id/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { order_status } = req.body;

        await pool.query(
            'UPDATE orders SET order_status = ? WHERE id = ?',
            [order_status, req.params.id]
        );

        res.json({ success: true, message: 'Order status updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ DELIVERY ENDPOINTS ============

// Get countries (PUBLIC)
app.get('/api/delivery/countries', async (req, res) => {
    try {
        const [countries] = await pool.query(
            'SELECT * FROM delivery_countries WHERE is_active = TRUE ORDER BY country_name_en'
        );
        res.json({ success: true, countries });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get cities by country (PUBLIC)
app.get('/api/delivery/cities/:countryId', async (req, res) => {
    try {
        const [cities] = await pool.query(
            'SELECT * FROM delivery_cities WHERE country_id = ? AND is_active = TRUE ORDER BY city_name_en',
            [req.params.countryId]
        );
        res.json({ success: true, cities });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ GENERAL INFO ENDPOINT ============

// Get general info (PUBLIC)
app.get('/api/general-info', async (req, res) => {
    try {
        const [info] = await pool.query('SELECT * FROM general_info LIMIT 1');

        if (info.length === 0) {
            return res.json({ success: false, message: 'No general info found' });
        }

        res.json({
            success: true,
            info: {
                brand_name: info[0].gi_brand_name,
                phone_number: info[0].gi_phone_number,
                email_address: info[0].gi_email_address,
                minimum_order_amount: info[0].gi_minimum_order_amount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update general info (PROTECTED)
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
                'UPDATE general_info SET gi_brand_name = ?, gi_phone_number = ?, gi_email_address = ?, gi_minimum_order_amount = ? WHERE gi_id = ?',
                [brand_name, phone_number, email_address, minimum_order_amount, existing[0].gi_id]
            );
        }

        res.json({ success: true, message: 'General info updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ STATS (PROTECTED) ============

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
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Primejo E-Commerce API running on port ${PORT}`);
    console.log(`✅ Database: ${dbConfig.database} @ ${dbConfig.host}`);
    console.log(`✅ Authentication enabled`);
});

module.exports = app;