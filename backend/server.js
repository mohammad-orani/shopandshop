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

const storeDomain = process.env.STORE_DOMAIN || 'shopandshop.online';

app.use(cors({
    origin: [
        `https://${storeDomain}`,
        `https://www.${storeDomain}`,
        'https://adminshopandshop.netlify.app',
        'https://clientshopandshop.netlify.app',
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
// helmet()'s default Cross-Origin-Resource-Policy: same-origin blocks the
// admin panel and storefront (separate Netlify origins, see the CORS
// allowlist above) from embedding these images at all — CORS only governs
// fetch/XHR, not <img> loading, so it doesn't help here. Relax CORP to
// cross-origin only for these static files; every other response keeps
// helmet's stricter default.
app.use(express.static('public', {
    setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
}));

// ============ ROUTES ============

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/customers',    require('./routes/customers').router);
app.use('/api/payments',     require('./routes/payments'));
app.use('/api/categories',   require('./routes/categories'));
app.use('/api/products',     require('./routes/products'));
app.use('/api/upload',       require('./routes/upload'));
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

async function ensureGeneralInfoTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS general_info (
                gi_id                   INT AUTO_INCREMENT PRIMARY KEY,
                gi_brand_name           VARCHAR(100),
                gi_phone_number         VARCHAR(30),
                gi_email_address        VARCHAR(150),
                gi_minimum_order_amount DECIMAL(10, 2) DEFAULT 0,
                gi_whatsapp             VARCHAR(300),
                gi_instagram            VARCHAR(300),
                gi_facebook             VARCHAR(300),
                gi_snapchat             VARCHAR(300),
                gi_tiktok               VARCHAR(300),
                gi_youtube              VARCHAR(300),
                gi_delivery_note        VARCHAR(300)
            )
        `);
        console.log('general_info table ready');
    } catch (err) {
        console.warn('general_info table migration warning:', err.message);
    }
}

async function ensureBannersTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS banners (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                title_en    VARCHAR(200),
                title_ar    VARCHAR(200),
                subtitle_en VARCHAR(300),
                subtitle_ar VARCHAR(300),
                btn_text_en VARCHAR(100) DEFAULT 'SHOP NOW',
                btn_text_ar VARCHAR(100) DEFAULT 'تسوق الآن',
                btn_link    VARCHAR(300) DEFAULT '#',
                image_url   TEXT,
                bg_color    VARCHAR(200) DEFAULT 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                sort_order  INT DEFAULT 0,
                is_active   BOOLEAN DEFAULT TRUE,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('banners table ready');
    } catch (err) {
        console.warn('banners table migration warning:', err.message);
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

async function ensureProductFreeDeliveryColumn() {
    try {
        const [cols] = await pool.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'`
        );
        if (!cols.map(c => c.COLUMN_NAME).includes('is_free_delivery')) {
            await pool.query(`ALTER TABLE products ADD COLUMN is_free_delivery BOOLEAN DEFAULT FALSE`);
            console.log('Added column: products.is_free_delivery');
        }
        console.log('products.is_free_delivery verified');
    } catch (err) {
        console.warn('is_free_delivery migration warning:', err.message);
    }
}

async function ensureProductColorVariantsColumn() {
    try {
        const [cols] = await pool.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'`
        );
        const existing = cols.map(c => c.COLUMN_NAME);
        if (!existing.includes('color_variants')) {
            await pool.query(`ALTER TABLE products ADD COLUMN color_variants JSON DEFAULT NULL`);
            console.log('Added column: products.color_variants');
        }
        console.log('products.color_variants verified');
    } catch (err) {
        console.warn('color_variants migration warning:', err.message);
    }
}

async function ensureOrderItemsVariantColumn() {
    try {
        const [cols] = await pool.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items'`
        );
        const existing = cols.map(c => c.COLUMN_NAME);
        if (!existing.includes('selected_variant')) {
            await pool.query(`ALTER TABLE order_items ADD COLUMN selected_variant VARCHAR(100) DEFAULT NULL`);
            console.log('Added column: order_items.selected_variant');
        }
        console.log('order_items.selected_variant verified');
    } catch (err) {
        console.warn('selected_variant migration warning:', err.message);
    }
}

async function ensureCategoriesVisibleColumn() {
    try {
        const [cols] = await pool.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories'`
        );
        if (!cols.map(c => c.COLUMN_NAME).includes('is_visible')) {
            await pool.query(`ALTER TABLE categories ADD COLUMN is_visible BOOLEAN DEFAULT TRUE`);
            console.log('Added column: categories.is_visible');
        }
        console.log('categories.is_visible verified');
    } catch (err) {
        console.warn('categories.is_visible migration warning:', err.message);
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
    await ensureGeneralInfoTable();
    await ensureBannersTable();
    await ensureGeneralInfoColumns();
    await ensureProductsQuantityTiersColumn();
    await ensureProductFreeDeliveryColumn();
    await ensureProductColorVariantsColumn();
    await ensureOrderItemsVariantColumn();
    await ensureCategoriesVisibleColumn();

    app.listen(PORT, () => {
        console.log(`${process.env.STORE_NAME || 'Store'} API running on port ${PORT}`);
    });
})();

module.exports = app;
