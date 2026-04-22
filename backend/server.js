// backend/server.js — Entry point

require('dotenv').config();

if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set. Server will not start.');
    process.exit(1);
}

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const pool       = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ============ SECURITY ============

app.use(helmet());

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' }
});

app.use(cors({
    origin: [
        'https://primejo.store',
        'https://www.primejo.store',
        'https://adminprimejo.netlify.app',
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        'http://localhost:3000',
        // Mobile app (Expo Go + production builds)
        /^https?:\/\/localhost(:\d+)?$/,
        /^exp:\/\//,
    ]
}));
app.use(generalLimiter);
// Stripe webhook needs raw body — must be registered before express.json()
app.use('/api/payments/webhook', require('./routes/payments'));
app.use(express.json());
app.use(express.static('public'));

// ============ ROUTES ============

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/customers',    require('./routes/customers').router);
app.use('/api/payments',     require('./routes/payments'));
app.use('/api/categories',   require('./routes/categories'));
app.use('/api/products',     require('./routes/products'));
app.use('/api/orders',       require('./routes/orders'));
app.use('/api/delivery',     require('./routes/delivery'));
app.use('/api/general-info', require('./routes/generalInfo'));
app.use('/api/banners',             require('./routes/banners'));
app.use('/api/stats',               require('./routes/stats'));
app.use('/api/admin-logs',          require('./routes/logs'));
app.use('/api/reports',             require('./routes/reports'));
app.use('/api/whatsapp-contacts',   require('./routes/whatsappContacts'));
app.use('/api/whatsapp',            require('./routes/whatsappBroadcast'));

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
            { name: 'actual_shipping_cost',    def: 'DECIMAL(10,2) DEFAULT 0' },
            { name: 'currency',                def: "VARCHAR(10) DEFAULT 'JOD'" },
            { name: 'order_status',            def: "VARCHAR(50) DEFAULT 'pending'" },
            { name: 'language',                def: "VARCHAR(10) DEFAULT 'en'" },
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
                INDEX idx_user    (user_name),
                INDEX idx_action  (action)
            )
        `);
        console.log('admin_logs table ready');
    } catch (err) {
        console.warn('admin_logs migration warning:', err.message);
    }
}

async function ensureProductsQuantityTiersColumn() {
    try {
        const [cols] = await pool.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'`
        );
        const existing = cols.map(c => c.COLUMN_NAME);
        if (!existing.includes('quantity_tiers')) {
            await pool.query(`ALTER TABLE products ADD COLUMN quantity_tiers JSON DEFAULT NULL`);
            console.log('Added column: products.quantity_tiers');
        }
        console.log('products.quantity_tiers verified');
    } catch (err) {
        console.warn('quantity_tiers migration warning:', err.message);
    }
}

async function ensureGeneralInfoColumns() {
    try {
        const newCols = [
            { name: 'gi_whatsapp',      def: 'VARCHAR(300)' },
            { name: 'gi_instagram',     def: 'VARCHAR(300)' },
            { name: 'gi_facebook',      def: 'VARCHAR(300)' },
            { name: 'gi_snapchat',      def: 'VARCHAR(300)' },
            { name: 'gi_tiktok',        def: 'VARCHAR(300)' },
            { name: 'gi_youtube',       def: 'VARCHAR(300)' },
            { name: 'gi_delivery_note', def: 'VARCHAR(300)' },
        ];
        const [cols] = await pool.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'general_info'`
        );
        const existing = cols.map(c => c.COLUMN_NAME);
        for (const col of newCols) {
            if (!existing.includes(col.name)) {
                await pool.query(`ALTER TABLE general_info ADD COLUMN \`${col.name}\` ${col.def}`);
                console.log(`Added column: general_info.${col.name}`);
            }
        }
        console.log('general_info columns verified');
    } catch (err) {
        console.warn('general_info migration warning:', err.message);
    }
}

async function ensureWhatsAppTables() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS whatsapp_contacts (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                name            VARCHAR(255) NOT NULL DEFAULT '',
                phone           VARCHAR(20)  NOT NULL,
                category        ENUM('VIP','Normal','New','Inactive','Custom') NOT NULL DEFAULT 'Normal',
                custom_category VARCHAR(100) NULL,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_phone (phone)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS whatsapp_broadcast_log (
                id            BIGINT AUTO_INCREMENT PRIMARY KEY,
                contact_id    INT   NULL,
                phone         VARCHAR(20) NOT NULL,
                message       TEXT NOT NULL,
                status        ENUM('sent','failed') NOT NULL,
                error_message TEXT NULL,
                sent_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_wbl_contact FOREIGN KEY (contact_id)
                    REFERENCES whatsapp_contacts(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('WhatsApp tables verified');
    } catch (err) {
        console.warn('WhatsApp tables migration warning:', err.message);
    }
}

// Run migrations then start server
(async () => {
    const dbConfig = {
        host:     process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.DB_PORT) || 3306,
        user:     process.env.DB_USER     || 'root',
        database: process.env.DB_NAME     || 'railway',
        password: process.env.DB_PASSWORD ? '***hidden***' : 'NOT SET'
    };
    console.log('Database Config:', dbConfig);

    await ensureWhatsAppTables();
    await ensureOrdersColumns();
    await ensureAdminLogsTable();
    await ensureGeneralInfoColumns();
    await ensureProductsQuantityTiersColumn();

    app.listen(PORT, () => {
        console.log(`Primejo API running on port ${PORT}`);
    });
})();

module.exports = app;
