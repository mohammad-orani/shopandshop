-- E-Commerce Database Seed Data
--
-- Run this AFTER schema.sql, against the same database. It inserts:
--   - Delivery countries and cities (with default/placeholder fees)
--   - A single placeholder admin user
--   - A single placeholder general_info row
-- Zero products, categories, orders, customers, or favorites are inserted —
-- those are added later through the admin panel.
--
-- IMPORTANT — delivery_countries / delivery_cities are order-dependent:
-- delivery_cities.country_id below is a hardcoded numeric value that assumes
-- delivery_countries.id is auto-assigned 1, 2, 3, ... in the exact order
-- countries are inserted (Jordan=1, Saudi Arabia=2, ... Australia=41). Do
-- not reorder, skip, or split the countries INSERT below, or the city
-- country_id values will point at the wrong country.
--
-- After importing this file:
--   1. Log into the admin panel with the placeholder admin user below and
--      change the password immediately (Settings → Change Password).
--   2. Fill in Store Details under General Info & Social Media.
--   3. Add categories, then products.

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
(1, 'Ajloun', 'عجلون', 2.50, 2.00, TRUE);

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
(2, 'Jubail', 'الجبيل', 3.50, 3.00, TRUE);

-- United Arab Emirates (country_id = 3)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(3, 'Dubai', 'دبي', 3.00, 3.00, TRUE),
(3, 'Abu Dhabi', 'أبو ظبي', 3.00, 3.00, TRUE),
(3, 'Sharjah', 'الشارقة', 3.00, 3.00, TRUE),
(3, 'Ajman', 'عجمان', 3.00, 3.00, TRUE),
(3, 'Ras Al Khaimah', 'رأس الخيمة', 3.50, 3.00, TRUE),
(3, 'Fujairah', 'الفجيرة', 3.50, 3.00, TRUE),
(3, 'Umm Al Quwain', 'أم القيوين', 3.00, 3.00, TRUE),
(3, 'Al Ain', 'العين', 3.00, 3.00, TRUE);

-- Kuwait (country_id = 4)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(4, 'Kuwait City', 'مدينة الكويت', 2.50, 2.50, TRUE),
(4, 'Hawalli', 'حولي', 2.50, 2.50, TRUE),
(4, 'Salmiya', 'السالمية', 2.50, 2.50, TRUE),
(4, 'Farwaniya', 'الفروانية', 2.50, 2.50, TRUE),
(4, 'Jahra', 'الجهراء', 3.00, 2.50, TRUE),
(4, 'Ahmadi', 'الأحمدي', 2.50, 2.50, TRUE);

-- Qatar (country_id = 5)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(5, 'Doha', 'الدوحة', 2.50, 2.50, TRUE),
(5, 'Al Rayyan', 'الريان', 2.50, 2.50, TRUE),
(5, 'Al Wakrah', 'الوكرة', 3.00, 2.50, TRUE),
(5, 'Al Khor', 'الخور', 3.00, 2.50, TRUE),
(5, 'Umm Salal', 'أم صلال', 2.50, 2.50, TRUE);

-- Bahrain (country_id = 6)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(6, 'Manama', 'المنامة', 2.00, 2.00, TRUE),
(6, 'Muharraq', 'المحرق', 2.00, 2.00, TRUE),
(6, 'Riffa', 'الرفاع', 2.00, 2.00, TRUE),
(6, 'Hamad Town', 'مدينة حمد', 2.00, 2.00, TRUE),
(6, 'Isa Town', 'مدينة عيسى', 2.00, 2.00, TRUE);

-- Oman (country_id = 7)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(7, 'Muscat', 'مسقط', 3.00, 3.00, TRUE),
(7, 'Salalah', 'صلالة', 4.00, 3.00, TRUE),
(7, 'Sohar', 'صحار', 3.50, 3.00, TRUE),
(7, 'Nizwa', 'نزوى', 3.50, 3.00, TRUE),
(7, 'Sur', 'صور', 3.50, 3.00, TRUE);

-- Palestine (country_id = 8)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(8, 'Jerusalem', 'القدس', 2.50, 2.00, TRUE),
(8, 'Ramallah', 'رام الله', 2.00, 2.00, TRUE),
(8, 'Bethlehem', 'بيت لحم', 2.00, 2.00, TRUE),
(8, 'Hebron', 'الخليل', 2.50, 2.00, TRUE),
(8, 'Nablus', 'نابلس', 2.50, 2.00, TRUE),
(8, 'Gaza', 'غزة', 3.00, 2.00, TRUE),
(8, 'Jenin', 'جنين', 2.50, 2.00, TRUE);

-- Lebanon (country_id = 9)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(9, 'Beirut', 'بيروت', 2.50, 2.50, TRUE),
(9, 'Tripoli', 'طرابلس', 3.00, 2.50, TRUE),
(9, 'Sidon', 'صيدا', 2.50, 2.50, TRUE),
(9, 'Tyre', 'صور', 3.00, 2.50, TRUE),
(9, 'Jounieh', 'جونيه', 2.50, 2.50, TRUE),
(9, 'Zahle', 'زحلة', 3.00, 2.50, TRUE);

-- Iraq (country_id = 10)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(10, 'Baghdad', 'بغداد', 3.50, 3.50, TRUE),
(10, 'Basra', 'البصرة', 4.00, 3.50, TRUE),
(10, 'Mosul', 'الموصل', 4.00, 3.50, TRUE),
(10, 'Erbil', 'أربيل', 4.00, 3.50, TRUE),
(10, 'Najaf', 'النجف', 3.50, 3.50, TRUE),
(10, 'Karbala', 'كربلاء', 3.50, 3.50, TRUE),
(10, 'Kirkuk', 'كركوك', 4.00, 3.50, TRUE);

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
(13, 'Tanta', 'طنطا', 3.00, 2.50, TRUE);

-- Morocco (country_id = 14)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(14, 'Casablanca', 'الدار البيضاء', 3.00, 3.00, TRUE),
(14, 'Rabat', 'الرباط', 3.00, 3.00, TRUE),
(14, 'Marrakech', 'مراكش', 3.50, 3.00, TRUE),
(14, 'Fes', 'فاس', 3.50, 3.00, TRUE),
(14, 'Tangier', 'طنجة', 3.50, 3.00, TRUE),
(14, 'Agadir', 'أكادير', 4.00, 3.00, TRUE);

-- United Kingdom (country_id = 19)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(19, 'London', 'لندن', 5.00, 5.00, TRUE),
(19, 'Manchester', 'مانشستر', 5.50, 5.00, TRUE),
(19, 'Birmingham', 'برمنغهام', 5.50, 5.00, TRUE),
(19, 'Liverpool', 'ليفربول', 5.50, 5.00, TRUE),
(19, 'Leeds', 'ليدز', 5.50, 5.00, TRUE),
(19, 'Glasgow', 'غلاسكو', 6.00, 5.00, TRUE),
(19, 'Edinburgh', 'إدنبرة', 6.00, 5.00, TRUE);

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
(28, 'Miami', 'ميامي', 7.50, 7.00, TRUE);

-- Canada (country_id = 29)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(29, 'Toronto', 'تورونتو', 7.00, 7.00, TRUE),
(29, 'Montreal', 'مونتريال', 7.00, 7.00, TRUE),
(29, 'Vancouver', 'فانكوفر', 7.50, 7.00, TRUE),
(29, 'Calgary', 'كالغاري', 7.50, 7.00, TRUE),
(29, 'Edmonton', 'إدمونتون', 7.50, 7.00, TRUE),
(29, 'Ottawa', 'أوتاوا', 7.00, 7.00, TRUE);

-- Australia (country_id = 41)
INSERT INTO delivery_cities (country_id, city_name_en, city_name_ar, actual_fee, displayed_fee, is_active) VALUES
(41, 'Sydney', 'سيدني', 8.00, 8.00, TRUE),
(41, 'Melbourne', 'ملبورن', 8.00, 8.00, TRUE),
(41, 'Brisbane', 'بريزبن', 8.50, 8.00, TRUE),
(41, 'Perth', 'بيرث', 9.00, 8.00, TRUE),
(41, 'Adelaide', 'أديليد', 8.50, 8.00, TRUE),
(41, 'Gold Coast', 'جولد كوست', 8.50, 8.00, TRUE);

-- ========================================
-- DEFAULT ADMIN USER — PLACEHOLDER ONLY
-- ========================================
-- The plaintext value below ('changeme123') IS the working password on
-- first login: auth.js detects it isn't a bcrypt hash, accepts it once,
-- and silently re-hashes it. CHANGE IT IMMEDIATELY after your first login
-- (Admin Panel → Settings → Change Password) — do not leave this active
-- in production.
INSERT INTO users (name, email, phone, password, role) VALUES
('Admin User', 'admin@yourstore.com', '+10000000000', 'changeme123', 'admin');

-- ========================================
-- GENERAL INFO — PLACEHOLDER ONLY
-- ========================================
-- Single settings row the admin panel reads/writes. Replace every value
-- via Admin Panel → General Info & Social Media before launch.
INSERT INTO general_info (gi_brand_name, gi_phone_number, gi_email_address, gi_minimum_order_amount) VALUES
('Your Store Name', '+10000000000', 'info@yourstore.com', 0);
