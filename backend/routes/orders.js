// routes/orders.js

const express  = require('express');
const pool     = require('../db');
const { notifyOrderStatusChange } = require('../notifications');
const { authenticateToken, isAdmin, logAction } = require('../middleware');
const { sendOrderConfirmation, notifyAdmin } = require('../utils/whatsapp');

const router = express.Router();

// Helper: fetch items for one order by its numeric DB id
async function fetchOrderItems(dbId) {
    const [rows] = await pool.query(
        `SELECT
            oi.product_id,
            oi.quantity,
            oi.price,
            oi.total,
            oi.selected_variant,
            COALESCE(p.name_en, oi.product_name_en, 'Unknown Product') AS product_name_en,
            COALESCE(p.name_ar, oi.product_name_ar, 'منتج غير معروف')  AS product_name_ar,
            p.image_url,
            p.cost_price
         FROM order_items oi
         LEFT JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?`,
        [dbId]
    );
    return rows.map(r => ({
        product_id:       r.product_id,
        productId:        r.product_id,
        productName:      r.product_name_en,
        productNameAr:    r.product_name_ar,
        image_url:        r.image_url || '',
        selected_variant: r.selected_variant || null,
        quantity:         r.quantity,
        price:            parseFloat(r.price    || 0),
        total:         parseFloat(r.total    || 0),
        cost_price:    parseFloat(r.cost_price || 0)
    }));
}

// POST /api/orders (PUBLIC)
router.post('/', async (req, res) => {
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
        const sanitizedPhone = (customer_phone || '').replace(/^(\+\d+?)0(\d)/, '$1$2');
        const displayedFee = parseFloat(delivery_fee ?? shipping_fee ?? 0);

        let actualFee = parseFloat(actual_delivery_fee ?? displayedFee ?? 0);
        if (delivery_city) {
            const [cityRows] = await connection.query(
                `SELECT actual_fee FROM delivery_cities
                 WHERE city_name_en = ? OR city_name_ar = ? LIMIT 1`,
                [delivery_city, delivery_city]
            );
            if (cityRows.length > 0 && cityRows[0].actual_fee != null) {
                actualFee = parseFloat(cityRows[0].actual_fee);
            }
        }

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
                customer_name || '', sanitizedPhone, customer_email || '',
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
                `INSERT INTO order_items (order_id, product_id, product_name_en, product_name_ar, quantity, price, total, selected_variant)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [dbOrderId, parseInt(item.productId), item.productName || '',
                    item.productNameAr || '', item.quantity, item.price, item.total,
                    item.selectedColor || null]
            );
        }

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
        await logAction(req, 'CREATE', 'order', order_id,
            `New order from ${customer_name || 'unknown'} (${sanitizedPhone}) | city: ${delivery_city || '—'} | total: ${total || 0} | items: ${(items || []).length}`
        );

        // WhatsApp notifications (fire-and-forget — never block the response)
        const waPhone = sanitizedPhone || customer_phone || '';
        if (waPhone) {
            sendOrderConfirmation(waPhone, customer_name || 'عزيزي العميل', order_id, total || 0)
                .catch(e => console.warn('WA confirmation failed:', e.message));
        }
        notifyAdmin(order_id, customer_name || 'Unknown', total || 0, waPhone)
            .catch(e => console.warn('WA admin notify failed:', e.message));

        // Auto-save customer phone to whatsapp_contacts
        // Normalise: strip non-digits, remove leading 00 or 0
        try {
            let waPhone = (sanitizedPhone || '').replace(/\D/g, '');
            if (waPhone.startsWith('00')) waPhone = waPhone.slice(2);
            else if (waPhone.startsWith('0')) waPhone = waPhone.slice(1);

            if (waPhone.length >= 7) {
                // Check how many orders this phone has placed (excluding current)
                const [[{ orderCount }]] = await pool.query(
                    `SELECT COUNT(*) AS orderCount FROM orders WHERE customer_phone = ?`,
                    [sanitizedPhone]
                );
                // 1st order → 'New', 2+ orders → 'Normal', upgrade VIP/Inactive only if not already set
                const newCategory = orderCount <= 1 ? 'New' : 'Normal';

                await pool.query(
                    `INSERT INTO whatsapp_contacts (name, phone, category)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                         name     = IF(name = '' OR name IS NULL, VALUES(name), name),
                         category = IF(category IN ('New'), ?, category)`,
                    [customer_name || '', waPhone, newCategory, newCategory]
                );
            }
        } catch (waErr) {
            console.warn('WA contact auto-save warning:', waErr.message);
        }

        res.status(201).json({ success: true, message: 'Order created successfully', order_id });

    } catch (error) {
        await connection.rollback();
        console.error('Create order error:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
});

// GET /api/orders (PROTECTED)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { status, from_date, to_date, limit, offset } = req.query;

        let query = 'SELECT * FROM orders WHERE 1=1';
        const params = [];
        if (status)    { query += ' AND order_status = ?'; params.push(status); }
        if (from_date) { query += ' AND created_at >= ?';  params.push(from_date); }
        if (to_date)   { query += ' AND created_at <= ?';  params.push(to_date); }
        query += ' ORDER BY created_at DESC';

        const pageLimit  = limit  ? parseInt(limit,  10) : 100;
        const pageOffset = offset ? parseInt(offset, 10) : 0;
        query += ' LIMIT ? OFFSET ?';
        params.push(pageLimit, pageOffset);

        const [[{ total }]] = await pool.query(
            'SELECT COUNT(*) as total FROM orders WHERE 1=1' +
            (status    ? ' AND order_status = ?' : '') +
            (from_date ? ' AND created_at >= ?'  : '') +
            (to_date   ? ' AND created_at <= ?'  : ''),
            [status, from_date, to_date].filter(Boolean)
        );

        const [orders] = await pool.query(query, params);
        if (orders.length === 0) return res.json({ total, orders: [] });

        const orderIds     = orders.map(o => o.id);
        const placeholders = orderIds.map(() => '?').join(',');
        const [items] = await pool.query(
            `SELECT
                oi.order_id, oi.product_id, oi.quantity, oi.price, oi.total,
                COALESCE(p.name_en, oi.product_name_en, 'Unknown Product') AS product_name,
                COALESCE(p.name_ar, oi.product_name_ar, 'منتج غير معروف')  AS product_name_ar,
                p.image_url, p.cost_price
             FROM order_items oi
             LEFT JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id IN (${placeholders})`,
            orderIds
        );

        const itemsByOrder = {};
        items.forEach(item => {
            if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
            itemsByOrder[item.order_id].push({
                product_id:    item.product_id,
                productId:     item.product_id,
                productName:   item.product_name,
                productNameAr: item.product_name_ar,
                image_url:     item.image_url || '',
                quantity:      item.quantity,
                price:         parseFloat(item.price      || 0),
                total:         parseFloat(item.total      || 0),
                cost_price:    parseFloat(item.cost_price || 0)
            });
        });

        res.json({
            total,
            orders: orders.map(order => ({ ...order, items: itemsByOrder[order.id] || [] }))
        });

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/orders/:id (PROTECTED)
router.get('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const param = req.params.id;
        let orders;
        if (/^\d+$/.test(param)) {
            [orders] = await pool.query(
                'SELECT * FROM orders WHERE id = ? OR order_id = ? LIMIT 1',
                [parseInt(param, 10), param]
            );
        } else {
            [orders] = await pool.query(
                'SELECT * FROM orders WHERE order_id = ? LIMIT 1', [param]
            );
        }
        if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });

        const order = orders[0];
        const items = await fetchOrderItems(order.id);
        res.json({ ...order, items });
    } catch (error) {
        console.error('Get single order error:', error);
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { order_status } = req.body;
        const param = req.params.id;
        if (/^\d+$/.test(param)) {
            await pool.query('UPDATE orders SET order_status = ? WHERE id = ?', [order_status, parseInt(param)]);
        } else {
            await pool.query('UPDATE orders SET order_status = ? WHERE order_id = ?', [order_status, param]);
        }
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

// PATCH /api/orders/:id/cancel
router.patch('/:id/cancel', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { cancel_reason } = req.body;
        const param = req.params.id;
        if (!cancel_reason || !cancel_reason.trim())
            return res.status(400).json({ success: false, error: 'Cancel reason is required' });

        if (/^\d+$/.test(param)) {
            await pool.query(
                'UPDATE orders SET order_status = ?, order_notes = ? WHERE id = ?',
                ['cancelled', cancel_reason.trim(), parseInt(param)]
            );
        } else {
            await pool.query(
                'UPDATE orders SET order_status = ?, order_notes = ? WHERE order_id = ?',
                ['cancelled', cancel_reason.trim(), param]
            );
        }
        const [[order]] = await pool.query(
            'SELECT * FROM orders WHERE order_id = ? OR id = ? LIMIT 1',
            [param, parseInt(param) || 0]
        );
        if (order) await notifyOrderStatusChange(order, 'cancelled');
        await logAction(req, 'CANCEL', 'order', param, `Order ${param} cancelled — reason: ${cancel_reason.trim()}`);
        res.json({ success: true, message: 'Order marked as cancelled' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH /api/orders/:id/refund
router.patch('/:id/refund', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { refund_reason } = req.body;
        const param = req.params.id;
        if (!refund_reason || !refund_reason.trim())
            return res.status(400).json({ success: false, error: 'Refund reason is required' });

        if (/^\d+$/.test(param)) {
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

// PATCH /api/orders/:id — edit order details
router.patch('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const param = req.params.id;
        const { customer_name, customer_phone, delivery_country, delivery_city,
                delivery_address, order_notes, delivery_fee } = req.body;

        const fields = [];
        const values = [];
        if (customer_name    !== undefined) { fields.push('customer_name = ?');    values.push(customer_name); }
        if (customer_phone   !== undefined) { fields.push('customer_phone = ?');   values.push(customer_phone); }
        if (delivery_country !== undefined) { fields.push('delivery_country = ?'); values.push(delivery_country); }
        if (delivery_city    !== undefined) { fields.push('delivery_city = ?');    values.push(delivery_city); }
        if (delivery_address !== undefined) { fields.push('delivery_address = ?'); values.push(delivery_address); }
        if (order_notes      !== undefined) { fields.push('order_notes = ?');      values.push(order_notes); }
        if (delivery_fee     !== undefined) { fields.push('displayed_shipping_cost = ?'); values.push(parseFloat(delivery_fee) || 0); }

        if (fields.length === 0)
            return res.status(400).json({ success: false, error: 'No fields to update' });

        if (/^\d+$/.test(param)) {
            values.push(parseInt(param));
            await pool.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, values);
        } else {
            values.push(param);
            await pool.query(`UPDATE orders SET ${fields.join(', ')} WHERE order_id = ?`, values);
        }
        await logAction(req, 'UPDATE', 'order', param, `Order ${param} details edited`);
        res.json({ success: true, message: 'Order updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
