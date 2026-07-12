-- E-Commerce Database Schema — STRUCTURE ONLY
--
-- Run this against a brand-new, empty MySQL database only. It creates the
-- full application table structure (system tables, delivery structure,
-- configuration tables) — CREATE TABLE, PRIMARY KEY, FOREIGN KEY, INDEXES,
-- and constraints ONLY. No data is inserted by this file.
--
-- After this file, run seed.sql to populate the default admin user, store
-- settings placeholder, and delivery countries/cities — see that file's own
-- header for details.
--
-- This file is self-contained but not fully exhaustive: a handful of tables
-- (admin_logs, whatsapp_contacts, whatsapp_broadcast_log) and a few columns
-- are created automatically the first time backend/server.js boots against
-- this database (see the AUTO-MIGRATE section there) — you do not need to
-- add them by hand.

-- Categories Table
CREATE TABLE categories (
    id VARCHAR(50) PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_visible (is_visible)
);

-- Products Table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_en VARCHAR(200) NOT NULL,
    name_ar VARCHAR(200) NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    category_id VARCHAR(50),
    cost_price DECIMAL(10, 2) DEFAULT 0 COMMENT 'Cost price for internal reports only',
    old_price DECIMAL(10, 2) NOT NULL,
    new_price DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0 COMMENT 'Actual stock quantity (hidden from customers)',
    quantity_to_sell INT DEFAULT 0 COMMENT 'Quantity displayed to customers',
    image_url VARCHAR(500),
    additional_images TEXT,
    video_url VARCHAR(500),
    is_offer BOOLEAN DEFAULT FALSE,
    is_top_seller BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_category (category_id),
    INDEX idx_visible (is_visible),
    INDEX idx_offer (is_offer)
);

-- Users Table (for customers and admin)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255),
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_phone (phone)
);

-- Orders Table
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    user_id INT,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(100),
    delivery_country VARCHAR(100) NOT NULL,
    delivery_city VARCHAR(100) NOT NULL,
    delivery_street VARCHAR(200) NOT NULL,
    delivery_building VARCHAR(50) NOT NULL,
    delivery_floor VARCHAR(50),
    delivery_address TEXT,
    order_notes TEXT,
    payment_method ENUM('cash', 'online') DEFAULT 'cash',
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    order_status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    currency VARCHAR(10) DEFAULT 'USD',
    currency_rate DECIMAL(10, 4) DEFAULT 1.0000,
    subtotal DECIMAL(10, 2) NOT NULL,
    displayed_shipping_cost DECIMAL(10, 2) DEFAULT 0 COMMENT 'Shipping cost shown to customer',
    actual_shipping_cost DECIMAL(10, 2) DEFAULT 0 COMMENT 'Actual shipping cost (for reports)',
    total DECIMAL(10, 2) NOT NULL,
    language VARCHAR(2) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_order_id (order_id),
    INDEX idx_customer_phone (customer_phone),
    INDEX idx_order_status (order_status),
    INDEX idx_created_at (created_at)
);

-- Order Items Table
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    product_name_en VARCHAR(200) NOT NULL,
    product_name_ar VARCHAR(200) NOT NULL,
    quantity INT NOT NULL,
    cost_price DECIMAL(10, 2) DEFAULT 0 COMMENT 'Cost price per item (for profit calculation)',
    price DECIMAL(10, 2) NOT NULL COMMENT 'Selling price per item',
    subtotal DECIMAL(10, 2) NOT NULL COMMENT 'Total selling price (price * quantity)',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_order (order_id),
    INDEX idx_product (product_id)
);

-- Favorites Table (for registered users)
CREATE TABLE favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, product_id)
);

-- Delivery Fees Tables
CREATE TABLE delivery_countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    country_name_en VARCHAR(100) NOT NULL,
    country_name_ar VARCHAR(100) NOT NULL,
    default_fee DECIMAL(10, 2) DEFAULT 0 COMMENT 'Default delivery fee for all cities in this country',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active)
);

CREATE TABLE delivery_cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    country_id INT NOT NULL,
    city_name_en VARCHAR(100) NOT NULL,
    city_name_ar VARCHAR(100) NOT NULL,
    actual_fee DECIMAL(10, 2) NOT NULL COMMENT 'Actual delivery fee charged (shown in reports)',
    displayed_fee DECIMAL(10, 2) NOT NULL COMMENT 'Fee displayed to customers',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (country_id) REFERENCES delivery_countries(id) ON DELETE CASCADE,
    INDEX idx_country (country_id),
    INDEX idx_active (is_active)
);

-- General Info Table (single-row store configuration — brand name, contact
-- info, social links; edited via the admin panel's "General Info" section)
CREATE TABLE general_info (
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
);

-- Banners Table (homepage hero/promotional slides — managed via the admin
-- panel's "Banners" section; the storefront shows a static fallback hero
-- when this table has no active rows, so it's fine to leave empty at launch)
CREATE TABLE banners (
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
);

-- Categories table is ready for manual data entry through admin panel
-- Add categories through the admin dashboard at admin/index.html
