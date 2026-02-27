// ==================== APP.JS - MAIN APPLICATION LOGIC ====================
// Uses api.js for all data fetching from database

// Language Management
let currentLanguage = 'ar';
let currentCurrency = 'JOD';

// Currency exchange rates
const currencyRates = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JOD: 1,
    AED: 3.67,
    SAR: 3.75
};

const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JOD: 'JOD',
    AED: 'AED',
    SAR: 'SAR'
};

// ==================== PRICE FORMATTING ====================

function formatPrice(price) {
    if (!price || isNaN(price)) return '';
    const converted = (parseFloat(price) * currencyRates[currentCurrency]).toFixed(2);
    const symbol = currencySymbols[currentCurrency];
    return ['JOD', 'AED', 'SAR'].includes(currentCurrency)
        ? `${converted} ${symbol}`
        : `${symbol}${converted}`;
}

function changeCurrency(currency) {
    if (!currencyRates[currency]) return;
    currentCurrency = currency;
    localStorage.setItem('preferredCurrency', currency);
    console.log('💱 Currency changed to:', currency);
    refreshAllPricesNow();
}

function refreshAllPricesNow() {
    console.log('🔄 Refreshing prices for:', currentCurrency);

    document.querySelectorAll('[data-base-price]').forEach(el => {
        const base = parseFloat(el.getAttribute('data-base-price'));
        if (!isNaN(base)) el.textContent = formatPrice(base);
    });

    if (typeof renderProductsPage === 'function') renderProductsPage();
    if (typeof reloadHomeProducts === 'function') reloadHomeProducts();
    if (typeof loadCartItems === 'function') loadCartItems();
    if (typeof loadOrderSummary === 'function') loadOrderSummary();
    if (typeof loadProductDetails === 'function') loadProductDetails();
    if (typeof loadCategoryProducts === 'function') loadCategoryProducts();
    if (typeof loadFavorites === 'function') loadFavorites();
}

// ==================== LANGUAGE SWITCHING ====================

function switchLanguage(lang) {
    currentLanguage = lang;
    lang = 'ar';
    document.documentElement.lang = lang;
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';

    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    const langBtn = document.getElementById(`lang-${lang}`);
    if (langBtn) langBtn.classList.add('active');

    document.querySelectorAll('[data-en][data-ar]').forEach(element => {
        const translation = element.getAttribute(`data-${lang}`);
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = translation;
        } else {
            element.textContent = translation;
        }
    });

    const breadcrumb = document.getElementById('breadcrumb-current');
    if (breadcrumb) {
        const breadcrumbText = breadcrumb.getAttribute(`data-${lang}`);
        if (breadcrumbText) breadcrumb.textContent = breadcrumbText;
    }

    localStorage.setItem('preferredLanguage', lang);
}

// ==================== CATEGORIES MENU ====================

async function loadCategoriesMenu() {
    const menuContainer = document.getElementById('dynamicCategoryMenu');
    if (!menuContainer) return;

    try {
        const categories = await getCategories();

        let menuHTML = '<li><a href="category.html" data-en="All Products" data-ar="جميع المنتجات">All Products</a></li>';

        categories.forEach(cat => {
            menuHTML += `<li><a href="category.html?cat=${cat.id}" data-en="${cat.name_en}" data-ar="${cat.name_ar}">${cat.name_en}</a></li>`;
        });

        menuContainer.innerHTML = menuHTML;
        switchLanguage(currentLanguage);

    } catch (error) {
        console.error('Error loading categories menu:', error);
    }
}

async function loadHeaderCategories() {
    const dropdown = document.getElementById('categoriesDropdown');
    if (!dropdown) return;

    try {
        const categories = await getCategories();

        let html = '';
        categories.forEach(cat => {
            html += `
                <a href="category.html?cat=${cat.id}" 
                   data-en="${cat.name_en}" 
                   data-ar="${cat.name_ar}">
                    ${cat.name_en}
                </a>
            `;
        });

        dropdown.innerHTML = html;
        switchLanguage(currentLanguage);

    } catch (error) {
        console.error('Error loading header categories:', error);
    }
}

// ==================== PRODUCT CARD CREATION ====================

function createProductCard(product) {
    const nameKey = `name_${currentLanguage}`;

    const imageUrl = product.image || 'https://placehold.co/300x260?text=No+Image';
    const newPrice = parseFloat(product.newPrice || product.new_price || 0);
    const oldPrice = parseFloat(product.oldPrice || product.old_price || 0);

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

// ==================== LOAD HOMEPAGE PRODUCTS ====================

async function reloadHomeProducts() {
    try {
        const products = await getProducts();

        const topSellersEl = document.getElementById('topSellers');
        if (topSellersEl) {
            const topSellers = products.filter(p => p.topSeller && p.visible).slice(0, 4);
            topSellersEl.innerHTML = topSellers.map(createProductCard).join('') ||
                '<p style="text-align:center;padding:2rem;">No top sellers yet</p>';
        }

        const randomEl = document.getElementById('randomProducts');
        if (randomEl) {
            const random = products.filter(p => p.visible).sort(() => 0.5 - Math.random()).slice(0, 4);
            randomEl.innerHTML = random.map(createProductCard).join('') ||
                '<p style="text-align:center;padding:2rem;">No products available</p>';
        }

        const offersEl = document.getElementById('offerProducts');
        if (offersEl) {
            const offers = products.filter(p => p.isOffer && p.visible).slice(0, 4);
            offersEl.innerHTML = offers.map(createProductCard).join('') ||
                '<p style="text-align:center;padding:2rem;">No offers available</p>';
        }

        switchLanguage(currentLanguage);

    } catch (error) {
        console.error('Error loading home products:', error);
    }
}

if (document.getElementById('topSellers')) {
    reloadHomeProducts();
}

// NOTE: Slider is initialized in slider.js — do NOT init it here.

// ==================== PRODUCT FILTERING ====================

function filterProducts(category) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        const btnOnClick = btn.getAttribute('onclick');
        if (btnOnClick && btnOnClick.includes(`'${category}'`)) {
            btn.classList.add('active');
            updateBreadcrumb(btn);
        }
    });

    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        if (category === 'all') {
            product.style.display = 'block';
        } else if (category === 'new') {
            product.style.display = product.dataset.new === 'true' ? 'block' : 'none';
        } else if (category === 'topseller') {
            product.style.display = product.dataset.topseller === 'true' ? 'block' : 'none';
        }
    });

    updateProductCount();
}

function updateBreadcrumb(button) {
    const breadcrumbElement = document.getElementById('breadcrumb-current');
    if (!breadcrumbElement || !button) return;

    breadcrumbElement.classList.add('updating');
    setTimeout(() => {
        const textEn = button.getAttribute('data-en');
        const textAr = button.getAttribute('data-ar');
        breadcrumbElement.setAttribute('data-en', textEn);
        breadcrumbElement.setAttribute('data-ar', textAr);
        breadcrumbElement.textContent = currentLanguage === 'ar' ? textAr : textEn;
        breadcrumbElement.classList.remove('updating');
    }, 150);
}

function updateProductCount() {
    const productCountElement = document.getElementById('productCount');
    if (!productCountElement) return;

    const visibleProducts = document.querySelectorAll('.product-card[style*="display: block"], .product-card:not([style*="display: none"])');
    const count = visibleProducts.length;

    productCountElement.textContent = currentLanguage === 'ar'
        ? `عرض ${count} منتج`
        : `Showing ${count} products`;
}

// ==================== FAVORITES ====================

function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites')) || [];
}

function saveFavorites(favorites) {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function isInFavorites(productId) {
    return getFavorites().includes(productId);
}

function toggleFavorite(productId) {
    let favorites = getFavorites();
    if (favorites.includes(productId)) {
        favorites = favorites.filter(id => id !== productId);
    } else {
        favorites.push(productId);
    }
    saveFavorites(favorites);
    const btn = event.target;
    btn.classList.toggle('active');
}

// ==================== LOAD FAVORITES PAGE ====================

async function loadFavorites() {
    const container = document.getElementById('favoritesGrid');
    if (!container) return;

    const favoriteIds = getFavorites();

    // Empty state
    if (favoriteIds.length === 0) {
        container.innerHTML = `
            <div class="empty-favorites">
                <div class="empty-favorites-icon">🤍</div>
                <h2 data-en="No Favorites Yet" data-ar="لا توجد مفضلة بعد">No Favorites Yet</h2>
                <p data-en="Items you heart will appear here." data-ar="ستظهر المنتجات التي تضيفها للمفضلة هنا.">
                    Items you heart will appear here.
                </p>
                <button class="fav-shop-btn" onclick="window.location.href='index.html'"
                    data-en="Start Shopping" data-ar="ابدأ التسوق">Start Shopping</button>
            </div>`;
        switchLanguage(currentLanguage);
        return;
    }

    // Loading state
    container.innerHTML = `<div class="fav-loading">Loading...</div>`;

    try {
        const allProducts = await getProducts();
        const nameKey = `name_${currentLanguage}`;

        // Filter only favorited products
        const favoriteProducts = allProducts.filter(p => favoriteIds.includes(p.id));

        if (favoriteProducts.length === 0) {
            // IDs saved but products not found (deleted from DB)
            saveFavorites([]);
            container.innerHTML = `
                <div class="empty-favorites">
                    <div class="empty-favorites-icon">🤍</div>
                    <h2 data-en="No Favorites Found" data-ar="لم يتم العثور على مفضلة">No Favorites Found</h2>
                    <button class="fav-shop-btn" onclick="window.location.href='index.html'"
                        data-en="Browse Products" data-ar="تصفح المنتجات">Browse Products</button>
                </div>`;
            switchLanguage(currentLanguage);
            return;
        }

        // Render favorite cards
        container.innerHTML = favoriteProducts.map(product => {
            const imageUrl = product.image || 'https://placehold.co/300x300?text=No+Image';
            const newPrice = parseFloat(product.newPrice || product.new_price || 0);
            const oldPrice = parseFloat(product.oldPrice || product.old_price || 0);
            const name = product[nameKey] || product.name_en || 'Product';

            return `
                <div class="favorite-card" data-product-id="${product.id}">
                    <div class="fav-card-image" onclick="viewProduct(${product.id})">
                        <img src="${imageUrl}"
                             alt="${name.replace(/"/g, '&quot;')}"
                             loading="lazy"
                             onerror="this.onerror=null;this.src='https://placehold.co/300x300?text=No+Image'">
                        <button class="fav-remove-btn"
                                title="Remove from favorites"
                                onclick="event.stopPropagation(); removeFavorite(${product.id})">
                            ✕
                        </button>
                    </div>
                    <div class="fav-card-info">
                        <h3 class="fav-card-name" onclick="viewProduct(${product.id})">${name}</h3>
                        <div class="fav-card-price">
                            <span class="price-new" data-base-price="${newPrice}">${formatPrice(newPrice)}</span>
                            ${oldPrice && oldPrice !== newPrice
                                ? `<span class="price-old" data-base-price="${oldPrice}">${formatPrice(oldPrice)}</span>`
                                : ''}
                        </div>
                        <button class="fav-add-to-cart"
                                onclick="addToCart(${product.id})"
                                data-en="Add to Cart"
                                data-ar="أضف للسلة">
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Update favorites count badge
        updateFavoritesCount();
        switchLanguage(currentLanguage);

        console.log('✅ Loaded', favoriteProducts.length, 'favorites');

    } catch (error) {
        console.error('Error loading favorites:', error);
        container.innerHTML = `
            <div class="empty-favorites">
                <p style="color:#e74c3c;" data-en="Failed to load favorites." data-ar="فشل تحميل المفضلة.">
                    Failed to load favorites.
                </p>
            </div>`;
    }
}

// Remove a single product from favorites and re-render
function removeFavorite(productId) {
    let favorites = getFavorites();
    favorites = favorites.filter(id => id !== productId);
    saveFavorites(favorites);

    // Animate card out then reload
    const card = document.querySelector(`.favorite-card[data-product-id="${productId}"]`);
    if (card) {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        setTimeout(() => loadFavorites(), 300);
    } else {
        loadFavorites();
    }

    // Also update heart buttons on other pages if present
    document.querySelectorAll(`.btn-fav[data-id="${productId}"], .icon-btn[data-fav="${productId}"]`)
        .forEach(btn => btn.classList.remove('active'));

    updateFavoritesCount();
}

// Update the heart badge count in the header
function updateFavoritesCount() {
    const count = getFavorites().length;
    const badge = document.getElementById('favCount');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
}

// Auto-load favorites page on DOM ready
if (document.getElementById('favoritesGrid')) {
    document.addEventListener('DOMContentLoaded', loadFavorites);
}

// ==================== NAVIGATION ====================

function viewProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}

// ==================== INITIALIZATION ====================

window.addEventListener('DOMContentLoaded', async () => {
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    switchLanguage(savedLang);

    const savedCurrency = localStorage.getItem('preferredCurrency') || 'JOD';
    currentCurrency = savedCurrency;
    const currencySelector = document.getElementById('currencySelector');
    if (currencySelector) {
        currencySelector.value = savedCurrency;
        currencySelector.addEventListener('change', function () {
            changeCurrency(this.value);
        });
    }

    await loadCategoriesMenu();
    await loadHeaderCategories();

    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }

    console.log('✅ App initialized');
});

console.log('✅ app.js loaded');

// Load ALL products on homepage (for filter system)
if (document.getElementById('topbaicProductsGrid')) {
    (async function loadAllProducts() {
        try {
            const products = await getProducts();
            const grid = document.getElementById('topbaicProductsGrid');

            if (products.length === 0) {
                grid.innerHTML = '<p style="text-align:center;padding:3rem;color:#999;" data-en="No products available" data-ar="لا توجد منتجات متاحة">No products available</p>';
                return;
            }

            grid.innerHTML = products.map(createProductCard).join('');
            updateProductCount();

            if (typeof switchLanguage === 'function' && typeof currentLanguage !== 'undefined') {
                switchLanguage(currentLanguage);
            }

            console.log('✅ Loaded', products.length, 'products to homepage');

        } catch (error) {
            console.error('Error loading products:', error);
            document.getElementById('topbaicProductsGrid').innerHTML =
                '<p style="text-align:center;padding:3rem;color:#e74c3c;">Failed to load products</p>';
        }
    })();
}