/**
 * Category Page Logic — Fixed for API-based categories with numeric IDs
 */

const CAT_API = window.API_URL;

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
                <img src="${img}" alt="${name_en}" class="category-banner-image" loading="lazy"
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

    // Update category hero title (categories have no description field in the
    // schema, so #categoryDescription is intentionally left empty — CSS hides
    // it via :empty rather than showing a fabricated summary)
    const titleEl = document.getElementById('categoryTitle');
    if (titleEl && category) {
        titleEl.setAttribute('data-en', category.name_en);
        titleEl.setAttribute('data-ar', category.name_ar || category.name_en);
        titleEl.textContent = currentLanguage === 'ar'
            ? (category.name_ar || category.name_en)
            : category.name_en;
    }

    // SEO: give this category its own title/description/canonical/breadcrumb
    // instead of the generic "Categories" hub tags set in category.html.
    if (category) {
        const brandName = (window.BRAND && window.BRAND.name) || '';
        const siteUrl = (window.BRAND && window.BRAND.siteUrl) || '';
        const catName = category.name_en;

        document.title = `${catName} - ${brandName}`;

        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', `Shop ${catName} at ${brandName} — quality products, secure checkout, fast delivery.`);

        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.setAttribute('href', `${siteUrl}/category.html?cat=${categoryId}`);

        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', `${catName} - ${brandName}`);
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', `Shop ${catName} at ${brandName} — quality products, secure checkout, fast delivery.`);
        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) ogUrl.setAttribute('content', `${siteUrl}/category.html?cat=${categoryId}`);

        const breadcrumbSchema = document.getElementById('breadcrumbSchema');
        if (breadcrumbSchema) {
            breadcrumbSchema.textContent = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/index.html` },
                    { '@type': 'ListItem', position: 2, name: 'Categories', item: `${siteUrl}/category.html` },
                    { '@type': 'ListItem', position: 3, name: catName, item: `${siteUrl}/category.html?cat=${categoryId}` }
                ]
            });
        }
    }

    // Fetch products for this category
    currentCategoryId     = categoryId;
    allCategoryProducts   = await fetchProductsByCategory(categoryId);
    currentCategoryFilter = 'all';

    updateCategoryCount(allCategoryProducts.length);
    displayCategoryProducts(allCategoryProducts);

    if (typeof switchLanguage === 'function') switchLanguage(currentLanguage || 'en');
}

// ── Product count label (kept in sync with the currently filtered/sorted set) ──
function updateCategoryCount(count) {
    const countEl = document.getElementById('categoryCount');
    if (!countEl) return;
    const isAr = typeof currentLanguage !== 'undefined' && currentLanguage === 'ar';
    countEl.setAttribute('data-en', `${count} product(s)`);
    countEl.setAttribute('data-ar', `${count} منتج`);
    countEl.textContent = isAr ? `${count} منتج` : `${count} product(s)`;
}

// ── Display products using existing card function ─────────────────────────
function displayCategoryProducts(products) {
    const grid = document.getElementById('topbaicProductsGrid');
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h2 data-en="No products found" data-ar="لم يتم العثور على منتجات">
                    No products found
                </h2>
                <a href="category.html" data-en="View All Categories" data-ar="عرض جميع الفئات">
                   View All Categories
                </a>
            </div>`;
        if (typeof switchLanguage === 'function') switchLanguage(currentLanguage || 'en');
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
                <div class="product-card"
                     role="button"
                     tabindex="0"
                     aria-label="${name}"
                     onclick="window.location.href='product.html?id=${p.id}'"
                     onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='product.html?id=${p.id}';}">
                    <div class="product-image-wrapper">
                        <img src="${img}" alt="${name}" class="product-image" loading="lazy"
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

    updateCategoryCount(filtered.length);
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