-- Kiwi E-Commerce Database Schema

-- Categories Table
CREATE TABLE categories (
    id VARCHAR(50) PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
    password_hash VARCHAR(255),
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

-- Categories table is ready for manual data entry through admin panel
-- Add categories through the admin dashboard at admin/index.html

-- ========================================
-- INSERT ALL COUNTRIES WITH DEFAULT FEES
-- ========================================

INSERT INTO delivery_countries (country_name_en, country_name_ar, default_fee, is_active) VALUES
-- Middle East
('Jordan', 'الأردن', 2.00, TRUE),
('Saudi Arabia', 'السعودية', 3.00, TRUE),
('United Arab Emirates', 'الإمارات', 3.00, TRUE),
('Kuwait', 'الكويت', 2.50, TRUE),
('Qatar', 'قطر', 2.50, TRUE),
('Bahrain', 'البحرين', 2.00, TRUE),
('Oman', 'عمان', 3.00, TRUE),
('Palestine', 'فلسطين', 2.00, TRUE),
('Lebanon', 'لبنان', 2.50, TRUE),
('Iraq', 'العراق', 3.50, TRUE),
('Syria', 'سوريا', 3.00, TRUE),
('Yemen', 'اليمن', 4.00, TRUE),

-- North Africa
('Egypt', 'مصر', 2.50, TRUE),
('Morocco', 'المغرب', 3.00, TRUE),
('Algeria', 'الجزائر', 3.00, TRUE),
('Tunisia', 'تونس', 2.50, TRUE),
('Libya', 'ليبيا', 3.50, TRUE),
('Sudan', 'السودان', 3.50, TRUE),

-- Europe
('United Kingdom', 'المملكة المتحدة', 5.00, TRUE),
('Germany', 'ألمانيا', 5.00, TRUE),
('France', 'فرنسا', 5.00, TRUE),
('Italy', 'إيطاليا', 5.00, TRUE),
('Spain', 'إسبانيا', 5.00, TRUE),
('Netherlands', 'هولندا', 4.50, TRUE),
('Belgium', 'بلجيكا', 4.50, TRUE),
('Sweden', 'السويد', 5.50, TRUE),
('Turkey', 'تركيا', 3.00, TRUE),

-- North America
('United States', 'الولايات المتحدة', 7.00, TRUE),
('Canada', 'كندا', 7.00, TRUE),
('Mexico', 'المكسيك', 6.00, TRUE),

-- Asia
('India', 'الهند', 3.00, TRUE),
('Pakistan', 'باكستان', 3.00, TRUE),
('Bangladesh', 'بنغلاديش', 3.00, TRUE),
('China', 'الصين', 4.00, TRUE),
('Japan', 'اليابان', 6.00, TRUE),
('South Korea', 'كوريا الجنوبية', 5.00, TRUE),
('Malaysia', 'ماليزيا', 3.50, TRUE),
('Indonesia', 'إندونيسيا', 3.50, TRUE),
('Singapore', 'سنغافورة', 4.00, TRUE),
('Thailand', 'تايلاند', 3.50, TRUE),

-- Oceania
('Australia', 'أستراليا', 8.00, TRUE),
('New Zealand', 'نيوزيلندا', 8.00, TRUE);

-- ========================================
-- INSERT CITIES FOR EACH COUNTRY
-- ========================================

-- Jordan (country_id = 1)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(1, 'Amman', 'عمان', 2.00, 2.00, TRUE),
(1, 'Zarqa', 'الزرقاء', 2.00, 2.00, TRUE),
(1, 'Irbid', 'إربد', 2.50, 2.00, TRUE),
(1, 'Aqaba', 'العقبة', 3.50, 2.00, TRUE),
(1, 'Salt', 'السلط', 2.00, 2.00, TRUE),
(1, 'Madaba', 'مادبا', 2.00, 2.00, TRUE),
(1, 'Karak', 'الكرك', 2.50, 2.00, TRUE),
(1, 'Mafraq', 'المفرق', 2.50, 2.00, TRUE),
(1, 'Jerash', 'جرش', 2.00, 2.00, TRUE),
(1, 'Ajloun', 'عجلون', 2.50, 2.00, TRUE),

-- Saudi Arabia (country_id = 2)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(2, 'Riyadh', 'الرياض', 3.00, 3.00, TRUE),
(2, 'Jeddah', 'جدة', 3.00, 3.00, TRUE),
(2, 'Mecca', 'مكة', 3.00, 3.00, TRUE),
(2, 'Medina', 'المدينة', 3.00, 3.00, TRUE),
(2, 'Dammam', 'الدمام', 3.00, 3.00, TRUE),
(2, 'Khobar', 'الخبر', 3.00, 3.00, TRUE),
(2, 'Taif', 'الطائف', 3.50, 3.00, TRUE),
(2, 'Abha', 'أبها', 4.00, 3.00, TRUE),
(2, 'Tabuk', 'تبوك', 4.00, 3.00, TRUE),
(2, 'Jubail', 'الجبيل', 3.50, 3.00, TRUE),

-- United Arab Emirates (country_id = 3)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(3, 'Dubai', 'دبي', 3.00, 3.00, TRUE),
(3, 'Abu Dhabi', 'أبو ظبي', 3.00, 3.00, TRUE),
(3, 'Sharjah', 'الشارقة', 3.00, 3.00, TRUE),
(3, 'Ajman', 'عجمان', 3.00, 3.00, TRUE),
(3, 'Ras Al Khaimah', 'رأس الخيمة', 3.50, 3.00, TRUE),
(3, 'Fujairah', 'الفجيرة', 3.50, 3.00, TRUE),
(3, 'Umm Al Quwain', 'أم القيوين', 3.00, 3.00, TRUE),
(3, 'Al Ain', 'العين', 3.00, 3.00, TRUE),

-- Kuwait (country_id = 4)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(4, 'Kuwait City', 'مدينة الكويت', 2.50, 2.50, TRUE),
(4, 'Hawalli', 'حولي', 2.50, 2.50, TRUE),
(4, 'Salmiya', 'السالمية', 2.50, 2.50, TRUE),
(4, 'Farwaniya', 'الفروانية', 2.50, 2.50, TRUE),
(4, 'Jahra', 'الجهراء', 3.00, 2.50, TRUE),
(4, 'Ahmadi', 'الأحمدي', 2.50, 2.50, TRUE),

-- Qatar (country_id = 5)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(5, 'Doha', 'الدوحة', 2.50, 2.50, TRUE),
(5, 'Al Rayyan', 'الريان', 2.50, 2.50, TRUE),
(5, 'Al Wakrah', 'الوكرة', 3.00, 2.50, TRUE),
(5, 'Al Khor', 'الخور', 3.00, 2.50, TRUE),
(5, 'Umm Salal', 'أم صلال', 2.50, 2.50, TRUE),

-- Bahrain (country_id = 6)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(6, 'Manama', 'المنامة', 2.00, 2.00, TRUE),
(6, 'Muharraq', 'المحرق', 2.00, 2.00, TRUE),
(6, 'Riffa', 'الرفاع', 2.00, 2.00, TRUE),
(6, 'Hamad Town', 'مدينة حمد', 2.00, 2.00, TRUE),
(6, 'Isa Town', 'مدينة عيسى', 2.00, 2.00, TRUE),

-- Oman (country_id = 7)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(7, 'Muscat', 'مسقط', 3.00, 3.00, TRUE),
(7, 'Salalah', 'صلالة', 4.00, 3.00, TRUE),
(7, 'Sohar', 'صحار', 3.50, 3.00, TRUE),
(7, 'Nizwa', 'نزوى', 3.50, 3.00, TRUE),
(7, 'Sur', 'صور', 3.50, 3.00, TRUE),

-- Palestine (country_id = 8)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(8, 'Jerusalem', 'القدس', 2.50, 2.00, TRUE),
(8, 'Ramallah', 'رام الله', 2.00, 2.00, TRUE),
(8, 'Bethlehem', 'بيت لحم', 2.00, 2.00, TRUE),
(8, 'Hebron', 'الخليل', 2.50, 2.00, TRUE),
(8, 'Nablus', 'نابلس', 2.50, 2.00, TRUE),
(8, 'Gaza', 'غزة', 3.00, 2.00, TRUE),
(8, 'Jenin', 'جنين', 2.50, 2.00, TRUE),

-- Lebanon (country_id = 9)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(9, 'Beirut', 'بيروت', 2.50, 2.50, TRUE),
(9, 'Tripoli', 'طرابلس', 3.00, 2.50, TRUE),
(9, 'Sidon', 'صيدا', 2.50, 2.50, TRUE),
(9, 'Tyre', 'صور', 3.00, 2.50, TRUE),
(9, 'Jounieh', 'جونيه', 2.50, 2.50, TRUE),
(9, 'Zahle', 'زحلة', 3.00, 2.50, TRUE),

-- Iraq (country_id = 10)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(10, 'Baghdad', 'بغداد', 3.50, 3.50, TRUE),
(10, 'Basra', 'البصرة', 4.00, 3.50, TRUE),
(10, 'Mosul', 'الموصل', 4.00, 3.50, TRUE),
(10, 'Erbil', 'أربيل', 4.00, 3.50, TRUE),
(10, 'Najaf', 'النجف', 3.50, 3.50, TRUE),
(10, 'Karbala', 'كربلاء', 3.50, 3.50, TRUE),
(10, 'Kirkuk', 'كركوك', 4.00, 3.50, TRUE),

-- Egypt (country_id = 13)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(13, 'Cairo', 'القاهرة', 2.50, 2.50, TRUE),
(13, 'Alexandria', 'الإسكندرية', 3.00, 2.50, TRUE),
(13, 'Giza', 'الجيزة', 2.50, 2.50, TRUE),
(13, 'Shubra El Kheima', 'شبرا الخيمة', 2.50, 2.50, TRUE),
(13, 'Port Said', 'بورسعيد', 3.00, 2.50, TRUE),
(13, 'Suez', 'السويس', 3.00, 2.50, TRUE),
(13, 'Luxor', 'الأقصر', 3.50, 2.50, TRUE),
(13, 'Aswan', 'أسوان', 4.00, 2.50, TRUE),
(13, 'Mansoura', 'المنصورة', 3.00, 2.50, TRUE),
(13, 'Tanta', 'طنطا', 3.00, 2.50, TRUE),

-- Morocco (country_id = 14)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(14, 'Casablanca', 'الدار البيضاء', 3.00, 3.00, TRUE),
(14, 'Rabat', 'الرباط', 3.00, 3.00, TRUE),
(14, 'Marrakech', 'مراكش', 3.50, 3.00, TRUE),
(14, 'Fes', 'فاس', 3.50, 3.00, TRUE),
(14, 'Tangier', 'طنجة', 3.50, 3.00, TRUE),
(14, 'Agadir', 'أكادير', 4.00, 3.00, TRUE),

-- United Kingdom (country_id = 19)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(19, 'London', 'لندن', 5.00, 5.00, TRUE),
(19, 'Manchester', 'مانشستر', 5.50, 5.00, TRUE),
(19, 'Birmingham', 'برمنغهام', 5.50, 5.00, TRUE),
(19, 'Liverpool', 'ليفربول', 5.50, 5.00, TRUE),
(19, 'Leeds', 'ليدز', 5.50, 5.00, TRUE),
(19, 'Glasgow', 'غلاسكو', 6.00, 5.00, TRUE),
(19, 'Edinburgh', 'إدنبرة', 6.00, 5.00, TRUE),

-- United States (country_id = 28)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(28, 'New York', 'نيويورك', 7.00, 7.00, TRUE),
(28, 'Los Angeles', 'لوس أنجلوس', 7.50, 7.00, TRUE),
(28, 'Chicago', 'شيكاغو', 7.00, 7.00, TRUE),
(28, 'Houston', 'هيوستن', 7.00, 7.00, TRUE),
(28, 'Phoenix', 'فينيكس', 7.50, 7.00, TRUE),
(28, 'Philadelphia', 'فيلادلفيا', 7.00, 7.00, TRUE),
(28, 'San Antonio', 'سان أنطونيو', 7.00, 7.00, TRUE),
(28, 'San Diego', 'سان دييغو', 7.50, 7.00, TRUE),
(28, 'Dallas', 'دالاس', 7.00, 7.00, TRUE),
(28, 'Miami', 'ميامي', 7.50, 7.00, TRUE),

-- Canada (country_id = 29)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(29, 'Toronto', 'تورونتو', 7.00, 7.00, TRUE),
(29, 'Montreal', 'مونتريال', 7.00, 7.00, TRUE),
(29, 'Vancouver', 'فانكوفر', 7.50, 7.00, TRUE),
(29, 'Calgary', 'كالغاري', 7.50, 7.00, TRUE),
(29, 'Edmonton', 'إدمونتون', 7.50, 7.00, TRUE),
(29, 'Ottawa', 'أوتاوا', 7.00, 7.00, TRUE),

-- Australia (country_id = 41)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(41, 'Sydney', 'سيدني', 8.00, 8.00, TRUE),
(41, 'Melbourne', 'ملبورن', 8.00, 8.00, TRUE),
(41, 'Brisbane', 'بريزبن', 8.50, 8.00, TRUE),
(41, 'Perth', 'بيرث', 9.00, 8.00, TRUE),
(41, 'Adelaide', 'أديليد', 8.50, 8.00, TRUE),
(41, 'Gold Coast', 'جولد كوست', 8.50, 8.00, TRUE);

-- Create default admin user (password should be hashed in production)
-- UPDATE THIS PASSWORD BEFORE DEPLOYING TO PRODUCTION
INSERT INTO users (name, email, phone, password_hash, role) VALUES
('Admin User', 'admin@primejo.com', '+1234567890', 'hashed_password_here', 'admin');
