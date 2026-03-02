// ============ BANNERS ============
// Add this block to server.js before the "START" section
// Also run this SQL first:
/*
CREATE TABLE IF NOT EXISTS banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title_en VARCHAR(200),
    title_ar VARCHAR(200),
    subtitle_en VARCHAR(300),
    subtitle_ar VARCHAR(300),
    btn_text_en VARCHAR(100) DEFAULT 'SHOP NOW',
    btn_text_ar VARCHAR(100) DEFAULT 'تسوق الآن',
    btn_link VARCHAR(300) DEFAULT '#',
    image_url TEXT,
    bg_color VARCHAR(200) DEFAULT 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default banners
INSERT INTO banners (title_en, title_ar, subtitle_en, subtitle_ar, btn_text_en, btn_text_ar, bg_color, sort_order) VALUES
('Summer Collection 2024', 'مجموعة صيف 2024', 'Discover the latest trends', 'اكتشف أحدث الصيحات', 'SHOP NOW', 'تسوق الآن', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 1),
('New Arrivals', 'وصل حديثاً', 'Premium quality products', 'منتجات عالية الجودة', 'EXPLORE', 'استكشف', 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 2),
('Special Offers', 'عروض خاصة', 'Limited time deals', 'عروض لفترة محدودة', 'VIEW DEALS', 'عرض الصفقات', 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 3);
*/

// GET /api/banners (PUBLIC)
app.get('/api/banners', async (req, res) => {
    try {
        const [banners] = await pool.query(
            'SELECT * FROM banners WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC'
        );
        res.json({ success: true, banners });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/banners/all (PROTECTED - includes inactive)
app.get('/api/banners/all', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [banners] = await pool.query('SELECT * FROM banners ORDER BY sort_order ASC, id ASC');
        res.json({ success: true, banners });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/banners (PROTECTED)
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
        res.status(201).json({ success: true, id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/banners/:id (PROTECTED)
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
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/banners/:id (PROTECTED)
app.delete('/api/banners/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM banners WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
