/**
 * Category Page Logic — Fixed for API-based categories with numeric IDs
 */

const CAT_API = 'https://primejo-ecommerce-backend-demo.up.railway.app/api';

let currentCategoryFilter = 'all';
let currentCategoryId     = null;
let allCategoryProducts   = [];

// ── Fetch categories from API ──────────────────────────────────────────────
async function fetchCategories() {
    try {
        const res  = await fetch(`${CAT_API}/categories`);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error('Failed to fetch categories:', e);
        return [];
    }
}

// ── Fetch products filtered by category_id from API ───────────────────────
async function fetchProductsByCategory(categoryId) {
    try {
        const res  = await fetch(`${CAT_API}/products?category=${categoryId}`);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error('Failed to fetch products:', e);
        return [];
    }
}

// ── Load category banners (no ?cat param) ─────────────────────────────────
async function loadCategoryBanners() {
    const grid = document.getElementById('categoryBannersGrid');
    if (!grid) return;

    grid.innerHTML = '<p style="padding:20px;color:#999;">Loading categories...</p>';

    const categories = await fetchCategories();

    if (categories.length === 0) {
        grid.innerHTML = '<p style="padding:20px;color:#999;">No categories found.</p>';
        return;
    }

    grid.innerHTML = categories.map(cat => {
        const name_en = cat.name_en || cat.id;
        const name_ar = cat.name_ar || name_en;
        // Use category image if available, fallback to placeholder
        const img = cat.image_url || cat.image ||
            'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=600&fit=crop';
        return `
            <div class="category-banner scroll-reveal"
                 onclick="window.location.href='category.html?cat=${cat.id}'">
                <img src="${img}" alt="${name_en}" class="category-banner-image"
                     onerror="this.src='https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=600&fit=crop'">
                <div class="category-banner-overlay">
                    <h3 class="category-banner-title"
                        data-en="${name_en}" data-ar="${name_ar}">${name_en}</h3>
                </div>
            </div>`;
    }).join('');

    if (typeof switchLanguage === 'function') switchLanguage(currentLanguage || 'en');
}

// ── Load single category products ─────────────────────────────────────────
async function loadCategoryProducts(categoryId) {
    // Show loading state
    document.getElementById('categoryBannersSection').style.display  = 'none';
    document.getElementById('categoryProductsSection').style.display = 'block';

    const grid = document.getElementById('topbaicProductsGrid');
    if (grid) grid.innerHTML = '<p style="padding:40px;text-align:center;color:#999;">Loading products...</p>';

    // Fetch categories to get name
    const categories = await fetchCategories();

    // Match by numeric id OR string id
    const category = categories.find(c =>
        String(c.id) === String(categoryId)
    );

    // Update breadcrumb
    const breadcrumb = document.getElementById('breadcrumbCategory');
    if (breadcrumb && category) {
        breadcrumb.setAttribute('data-en', category.name_en);
        breadcrumb.setAttribute('data-ar', category.name_ar || category.name_en);
        breadcrumb.textContent = currentLanguage === 'ar'
            ? (category.name_ar || category.name_en)
            : category.name_en;
    }

    // Fetch products for this category
    currentCategoryId     = categoryId;
    allCategoryProducts   = await fetchProductsByCategory(categoryId);
    currentCategoryFilter = 'all';

    displayCategoryProducts(allCategoryProducts);

    if (typeof switchLanguage === 'function') switchLanguage(currentLanguage || 'en');
}

// ── Display products using existing card function ─────────────────────────
function displayCategoryProducts(products) {
    const grid = document.getElementById('topbaicProductsGrid');
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
                <h2 style="font-size:24px;margin-bottom:16px;"
                    data-en="No products found" data-ar="لم يتم العثور على منتجات">
                    No products found
                </h2>
                <a href="category.html"
                   style="display:inline-block;padding:12px 32px;background:#1a1a1a;color:white;
                          text-decoration:none;border-radius:6px;font-weight:600;"
                   data-en="View All Categories" data-ar="عرض جميع الفئات">
                   View All Categories
                </a>
            </div>`;
        return;
    }

    // Use existing card builder if available, otherwise build simple cards
    if (typeof createTopBaicProductCard === 'function') {
        grid.innerHTML = products.map(p => createTopBaicProductCard(p)).join('');
    } else {
        grid.innerHTML = products.map(p => {
            const name  = currentLanguage === 'ar' ? (p.name_ar || p.name_en) : p.name_en;
            const price = p.new_price || p.newPrice || 0;
            const img   = p.image_url || p.image || '';
            return `
                <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'">
                    <div class="product-image-wrapper">
                        <img src="${img}" alt="${name}" class="product-image"
                             onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${name}</h3>
                        <p class="product-price">${price} JOD</p>
                    </div>
                </div>`;
        }).join('');
    }

    if (typeof switchLanguage === 'function') switchLanguage(currentLanguage || 'en');
}

// ── Filter buttons ─────────────────────────────────────────────────────────
function filterCategoryProducts(filter) {
    currentCategoryFilter = filter;

    let filtered = [...allCategoryProducts];
    if (filter === 'new')       filtered = filtered.filter(p => p.is_offer    || p.isNew);
    if (filter === 'topseller') filtered = filtered.filter(p => p.is_top_seller || p.isTopSeller);

    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');

    displayCategoryProducts(filtered);
}

// ── Sort select ────────────────────────────────────────────────────────────
function sortCategoryProducts(sortBy) {
    let sorted = [...allCategoryProducts];

    if (currentCategoryFilter === 'new')
        sorted = sorted.filter(p => p.is_offer || p.isNew);
    if (currentCategoryFilter === 'topseller')
        sorted = sorted.filter(p => p.is_top_seller || p.isTopSeller);

    switch (sortBy) {
        case 'price-low':  sorted.sort((a, b) => (a.new_price||0) - (b.new_price||0)); break;
        case 'price-high': sorted.sort((a, b) => (b.new_price||0) - (a.new_price||0)); break;
        case 'name':       sorted.sort((a, b) => (a.name_en||'').localeCompare(b.name_en||'')); break;
    }

    displayCategoryProducts(sorted);
}

// ── Init ───────────────────────────────────────────────────────────────────
async function initCategoryPage() {
    const urlParams  = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('cat');

    if (categoryId) {
        await loadCategoryProducts(categoryId);
    } else {
        document.getElementById('categoryBannersSection').style.display  = 'block';
        document.getElementById('categoryProductsSection').style.display = 'none';
        await loadCategoryBanners();
    }

    if (typeof updateCartCount === 'function') updateCartCount();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCategoryPage);
} else {
    initCategoryPage();
}