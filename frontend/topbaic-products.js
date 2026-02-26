// ============================================
// TOP BAIC STYLE PRODUCTS RENDERING
// Uses API via getProducts() from api.js
// ============================================

// Normalize product fields — API returns snake_case, old code used camelCase
function normalizeProduct(p) {
    return {
        ...p,
        // Image
        image: p.image_url || p.image || 'https://placehold.co/300x300?text=No+Image',
        // Prices
        newPrice: parseFloat(p.new_price || p.newPrice || 0),
        oldPrice: parseFloat(p.old_price || p.oldPrice || 0),
        // Flags — API returns tinyint (1/0), cast to boolean
        isNew: !!(p.isNew || p.is_offer == 1),
        isTopSeller: !!(p.topSeller || p.is_top_seller == 1),
        isOffer: !!(p.isOffer || p.is_offer == 1),
        isVisible: !!(p.visible || p.is_visible == 1),
        // Stock
        quantityToSell: parseInt(p.quantity_to_sell ?? p.quantityToSell ?? 0),
    };
}

// Create product card
function createTopBaicProductCard(rawProduct) {
    const product = normalizeProduct(rawProduct);
    const nameKey = `name_${currentLanguage || 'en'}`;
    const descKey = `description_${currentLanguage || 'en'}`;

    const discount = product.oldPrice && product.oldPrice > product.newPrice
        ? Math.round(((product.oldPrice - product.newPrice) / product.oldPrice) * 100)
        : 0;

    const availableQty = product.quantityToSell;
    let stockClass = 'stock-dot';
    let stockText = 'In Stock';
    let stockTextAr = 'متوفر';

    if (availableQty === 0) {
        stockClass = 'stock-dot out';
        stockText = 'Out of Stock';
        stockTextAr = 'غير متوفر';
    } else if (availableQty < 10) {
        stockClass = 'stock-dot low';
        stockText = `Only ${availableQty} left`;
        stockTextAr = `${availableQty} فقط متبقي`;
    }

    const productName = product[nameKey] || product.name_en || '';
    const productDesc = product[descKey] || product.description_en || '';

    return `
        <div class="topbaic-product-card product-card scroll-reveal">
            <!-- Image Wrapper -->
            <div class="product-image-wrapper">
                <img src="${product.image}"
                     alt="${productName.replace(/"/g, '&quot;')}"
                     class="product-image"
                     loading="lazy"
                     onerror="this.onerror=null;this.src='https://placehold.co/300x300?text=No+Image'">

                <!-- Badges -->
                <div class="product-badges">
                    ${product.isOffer || discount > 0 ? '<span class="badge badge-sale">SALE</span>' : ''}
                    ${product.isTopSeller ? '<span class="badge badge-topseller">TOP SELLER</span>' : ''}
                </div>

                <!-- Quick Actions -->
                <div class="quick-actions">
                    <button class="quick-action-btn"
                            onclick="event.stopPropagation(); toggleFavorite(${product.id})"
                            title="Add to Favorites">❤️</button>
                    <button class="quick-action-btn"
                            onclick="window.location.href='product.html?id=${product.id}'"
                            title="Quick View">👁️</button>
                </div>

                <!-- Free Delivery Badge 
                <div class="topbaic-delivery-banner"
                     style="position:absolute;bottom:12px;left:12px;right:12px;font-size:11px;padding:8px 12px;">
                    <span class="delivery-icon">🚚</span>
                    <span data-en="FREE DELIVERY" data-ar="توصيل مجاني">FREE DELIVERY</span>
                </div>-->
            </div>

            <!-- Product Info -->
            <div class="product-info">
               <!--   <div class="product-vendor">PRIMEJO PREMIUM</div>-->

                <h3 class="product-title">
                    <a href="product.html?id=${product.id}">${productName}</a>
                </h3>

                <!-- Rating 
                <div class="product-rating">
                    <div class="stars">★★★★★</div>
                </div>-->

                <!-- Price -->
                <div class="product-price">
                    <span class="price-current" data-base-price="${product.newPrice}">
                        ${formatPrice(product.newPrice)}
                    </span>
                    ${discount > 0 ? `
                        <span class="price-original" data-base-price="${product.oldPrice}">
                            ${formatPrice(product.oldPrice)}
                        </span>
                        <span class="price-save"
                              data-en="Save ${discount}%"
                              data-ar="وفر ${discount}%">Save ${discount}%</span>
                    ` : ''}
                </div>

                <!-- Stock Status -->
                <div class="stock-status">
                    <span class="${stockClass}"></span>
                    <span data-en="${stockText}" data-ar="${stockTextAr}">${stockText}</span>
                </div>

                <!-- Add to Cart Button -->
                <button class="add-to-cart-btn"
                        onclick="addToCartTopBaic(${product.id})"
                        ${availableQty === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
                    <span data-en="ADD TO CART" data-ar="أضف للسلة">ADD TO CART</span>
                </button>
            </div>
        </div>`;
}

// Add to cart
async function addToCartTopBaic(productId) {
    try {
        const products = await getProducts();
        const raw = products.find(p => p.id == productId);
        if (!raw) return;

        const product = normalizeProduct(raw);
        const cart = getCart();
        const existing = cart.find(item => item.productId == productId);

        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ productId, quantity: 1 });
        }

        saveCart(cart);
        updateCartCount();

        const nameKey = `name_${currentLanguage || 'en'}`;
        const name = product[nameKey] || product.name_en;

        if (window.ModernAnimations && window.ModernAnimations.showToast) {
            window.ModernAnimations.showToast(
                currentLanguage === 'ar' ? `✓ تمت الإضافة: ${name}` : `✓ Added: ${name}`,
                'success'
            );
        }
    } catch (err) {
        console.error('addToCartTopBaic error:', err);
    }
}

// Load all products into grid — fetches from API
async function loadTopBaicProducts() {
    const grid = document.getElementById('topbaicProductsGrid');
    if (!grid) return;

    // Skeleton loading
    if (window.ModernAnimations && window.ModernAnimations.showProductSkeleton) {
        window.ModernAnimations.showProductSkeleton(grid, 8);
    } else {
        grid.innerHTML = '<p style="padding:40px;text-align:center;color:#999;">Loading...</p>';
    }

    try {
        const products = await getProducts();

        if (!products.length) {
            grid.innerHTML = '<p style="text-align:center;padding:3rem;color:#999;" data-en="No products available" data-ar="لا توجد منتجات">No products available</p>';
            return;
        }

        grid.innerHTML = products.map(p => createTopBaicProductCard(p)).join('');

        // Product count
        const countEl = document.getElementById('productCount');
        if (countEl) {
            countEl.innerHTML = `<span data-en="Showing ${products.length} products"
                                       data-ar="عرض ${products.length} منتج">
                                    Showing ${products.length} products
                                 </span>`;
        }

        if (typeof switchLanguage === 'function') switchLanguage(currentLanguage || 'en');

        // Scroll reveals
        setTimeout(() => {
            document.querySelectorAll('.scroll-reveal').forEach((el, i) => {
                setTimeout(() => el.classList.add('revealed'), i * 80);
            });
        }, 100);

        console.log('✅ Loaded', products.length, 'products');

    } catch (err) {
        console.error('loadTopBaicProducts error:', err);
        grid.innerHTML = '<p style="text-align:center;padding:3rem;color:#e74c3c;">Failed to load products.</p>';
    }
}

// Filter (works on already-loaded cards)
let currentFilter = 'all';

async function filterProducts(filter, clickedBtn) {
    currentFilter = filter;

    // Use passed button element — global event is unreliable in async functions
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (clickedBtn) clickedBtn.classList.add('active');

    const grid = document.getElementById('topbaicProductsGrid');
    if (!grid) return;

    grid.innerHTML = '<p style="padding:40px;text-align:center;color:#999;">Loading...</p>';

    const allProducts = await getProducts();
    let filtered = allProducts;

    // Check both raw API fields (is_top_seller/is_offer) AND mapped fields (topSeller/isOffer)
    if (filter === 'new') filtered = allProducts.filter(p => p.is_offer == 1 || p.isOffer || p.isNew);
    if (filter === 'topseller') filtered = allProducts.filter(p => p.is_top_seller == 1 || p.topSeller || p.isTopSeller);

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align:center;padding:3rem;color:#999;" data-en="No products found" data-ar="لا توجد منتجات">No products found</p>';
        if (typeof switchLanguage === 'function') switchLanguage(currentLanguage || 'en');
        return;
    }

    grid.innerHTML = filtered.map(p => createTopBaicProductCard(p)).join('');
    if (typeof switchLanguage === 'function') switchLanguage(currentLanguage || 'en');
}

// Sort
async function sortProducts(sortBy) {
    const grid = document.getElementById('topbaicProductsGrid');
    if (!grid) return;

    const allProducts = await getProducts();
    let sorted = allProducts.map(normalizeProduct);

    if (currentFilter === 'new') sorted = sorted.filter(p => p.isOffer || p.isNew);
    if (currentFilter === 'topseller') sorted = sorted.filter(p => p.isTopSeller);

    switch (sortBy) {
        case 'price-low': sorted.sort((a, b) => a.newPrice - b.newPrice); break;
        case 'price-high': sorted.sort((a, b) => b.newPrice - a.newPrice); break;
        case 'name': sorted.sort((a, b) => (a.name_en || '').localeCompare(b.name_en || '')); break;
    }

    grid.innerHTML = sorted.map(p => createTopBaicProductCard(p)).join('');
    if (typeof switchLanguage === 'function') switchLanguage(currentLanguage || 'en');
}

// Navbar scroll effect
window.addEventListener('scroll', function () {
    const header = document.querySelector('.topbaic-header');
    if (header) header.classList.toggle('scrolled', window.scrollY > 50);
});

// Init
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('topbaicProductsGrid')) {
        loadTopBaicProducts();
    }
    console.log('✓ TOP BAIC style loaded');
});

window.TopBaic = {
    createProductCard: createTopBaicProductCard,
    loadProducts: loadTopBaicProducts,
    filterProducts: filterProducts,
    sortProducts: sortProducts,
    addToCart: addToCartTopBaic
};