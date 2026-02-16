// backend/server.js - Main Express Server
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
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

// Log database config on startup (hide password)
console.log('Database Config:', {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
    password: dbConfig.password ? '***hidden***' : 'NOT SET'
});

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// ============ AUTHENTICATION MIDDLEWARE ============
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// ============ CATEGORIES ENDPOINTS ============

// Get all categories
app.get('/api/categories', async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT * FROM categories ORDER BY name_en');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add category (admin only)
app.post('/api/categories', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id, name_en, name_ar } = req.body;
        const [result] = await pool.query(
            'INSERT INTO categories (id, name_en, name_ar) VALUES (?, ?, ?)',
            [id, name_en, name_ar]
        );
        res.status(201).json({ message: 'Category created', id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete category (admin only)
app.delete('/api/categories/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ PRODUCTS ENDPOINTS ============

// Get all products (with filters)
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

// Get single product
app.get('/api/products/:id', async (req, res) => {
    try {
        const [products] = await pool.query(
            'SELECT * FROM products WHERE id = ?',
            [req.params.id]
        );
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(products[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create product (admin only)
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

        res.status(201).json({ message: 'Product created', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update product (admin only)
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

        res.json({ message: 'Product updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete product (admin only)
app.delete('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ ORDERS ENDPOINTS ============

// Create order
app.post('/api/orders', async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const {
            customer_name, customer_phone, customer_email,
            delivery_country, delivery_city, delivery_address,
            order_notes, payment_method,
            displayed_shipping, actual_shipping,  // NEW!
            items, language
        } = req.body;

        // Calculate totals
        let subtotal = 0;
        for (const item of items) {
            subtotal += item.price * item.quantity;
        }

        const total = subtotal + (displayed_shipping || 0);
        const order_id = 'ORD-' + Date.now();

        // Insert order
        const [orderResult] = await connection.query(
            `INSERT INTO orders (
                order_id, customer_name, customer_phone, customer_email,
                delivery_country, delivery_city, delivery_address, order_notes, payment_method,
                subtotal, displayed_shipping_cost, actual_shipping_cost, total, language
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                order_id, customer_name, customer_phone, customer_email,
                delivery_country, delivery_city, delivery_address, order_notes, payment_method,
                subtotal, displayed_shipping || 0, actual_shipping || 0, total, language
            ]
        );

        const orderId = orderResult.insertId;

        // Insert order items and update stock
        for (const item of items) {
            await connection.query(
                `INSERT INTO order_items (
                    order_id, product_id, product_name_en, product_name_ar,
                    quantity, cost_price, price, subtotal
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId, item.product_id, item.product_name_en, item.product_name_ar,
                    item.quantity, item.cost_price || 0, item.price, item.price * item.quantity
                ]
            );

            // Update product stock
            await connection.query(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        await connection.commit();

        res.status(201).json({
            message: 'Order created successfully',
            order_id: order_id,
            total: total
        });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Get all orders (admin only)
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

// Get order details
app.get('/api/orders/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE id = ?',
            [req.params.id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const [items] = await pool.query(
            'SELECT * FROM order_items WHERE order_id = ?',
            [req.params.id]
        );

        res.json({
            ...orders[0],
            items: items
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update order status (admin only)
app.patch('/api/orders/:id/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { order_status } = req.body;

        await pool.query(
            'UPDATE orders SET order_status = ? WHERE id = ?',
            [order_status, req.params.id]
        );

        res.json({ message: 'Order status updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ STATS & REPORTS ============

app.get('/api/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [productCount] = await pool.query('SELECT COUNT(*) as count FROM products');
        const [orderCount] = await pool.query('SELECT COUNT(*) as count FROM orders');
        const [revenue] = await pool.query('SELECT SUM(total) as total FROM orders WHERE order_status = "delivered"');
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

// ============ DELIVERY FEES ENDPOINTS ============

// Get all countries
app.get('/api/delivery/countries', async (req, res) => {
    try {
        const [countries] = await pool.query(
            'SELECT * FROM delivery_countries WHERE is_active = TRUE ORDER BY country_name_en'
        );

        res.json({
            success: true,
            count: countries.length,
            countries: countries
        });
    } catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch countries',
            message: error.message
        });
    }
});

// Get cities by country
app.get('/api/delivery/cities/:countryId', async (req, res) => {
    try {
        const { countryId } = req.params;

        const [cities] = await pool.query(
            'SELECT * FROM delivery_cities WHERE country_id = ? AND is_active = TRUE ORDER BY city_name_en',
            [countryId]
        );

        res.json({
            success: true,
            count: cities.length,
            cities: cities
        });
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch cities'
        });
    }
});

// Get all cities
app.get('/api/delivery/cities', async (req, res) => {
    try {
        const [cities] = await pool.query(
            'SELECT * FROM delivery_cities WHERE is_active = TRUE ORDER BY country_id, city_name_en'
        );

        res.json({
            success: true,
            count: cities.length,
            cities: cities
        });
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch cities'
        });
    }
});

// Get delivery fee for specific city
app.get('/api/delivery/fee/:cityId', async (req, res) => {
    try {
        const { cityId } = req.params;

        const [cities] = await pool.query(
            'SELECT displayed_fee, actual_fee FROM delivery_cities WHERE id = ?',
            [cityId]
        );

        if (cities.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'City not found'
            });
        }

        res.json({
            success: true,
            displayedFee: cities[0].displayed_fee,
            actualFee: cities[0].actual_fee
        });
    } catch (error) {
        console.error('Error fetching delivery fee:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch delivery fee'
        });
    }
});

// ============ GENERAL INFO ENDPOINT ============

// Get general info (brand name, phone, email)
app.get('/api/general-info', async (req, res) => {
    try {
        const [info] = await pool.query(
            'SELECT * FROM general_info LIMIT 1'
        );

        if (info.length === 0) {
            return res.json({
                success: false,
                message: 'No general info found'
            });
        }

        res.json({
            success: true,
            info: {
                brand_name: info[0].gi_brand_name,
                phone_number: info[0].gi_phone_number,
                email_address: info[0].gi_email_address
            }
        });
    } catch (error) {
        console.error('Error fetching general info:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch general info'
        });
    }
});

// Update general info (admin only)
app.put('/api/general-info', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { brand_name, phone_number, email_address } = req.body;

        // Check if record exists
        const [existing] = await pool.query('SELECT * FROM general_info LIMIT 1');

        if (existing.length === 0) {
            // Insert new record
            await pool.query(
                'INSERT INTO general_info (gi_brand_name, gi_phone_number, gi_email_address) VALUES (?, ?, ?)',
                [brand_name, phone_number, email_address]
            );
        } else {
            // Update existing record
            await pool.query(
                'UPDATE general_info SET gi_brand_name = ?, gi_phone_number = ?, gi_email_address = ? WHERE gi_id = ?',
                [brand_name, phone_number, email_address, existing[0].gi_id]
            );
        }

        res.json({
            success: true,
            message: 'General info updated successfully'
        });
    } catch (error) {
        console.error('Error updating general info:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update general info'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Primejo E-Commerce API running on port ${PORT}`);
    console.log(`Database: ${dbConfig.database} @ ${dbConfig.host}`);
});

module.exports = app;
