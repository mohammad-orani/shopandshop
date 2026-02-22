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

    // Update all elements with data-base-price
    document.querySelectorAll('[data-base-price]').forEach(el => {
        const base = parseFloat(el.getAttribute('data-base-price'));
        if (!isNaN(base)) el.textContent = formatPrice(base);
    });

    // Re-render products if functions exist
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
    document.documentElement.lang = lang;
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Update active button
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    const langBtn = document.getElementById(`lang-${lang}`);
    if (langBtn) langBtn.classList.add('active');

    // Update all translatable elements
    document.querySelectorAll('[data-en][data-ar]').forEach(element => {
        const translation = element.getAttribute(`data-${lang}`);
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = translation;
        } else {
            element.textContent = translation;
        }
    });

    // Update breadcrumb
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
    // const descKey = `description_${currentLanguage}`;

    const imageUrl = product.image || 'https://placehold.co/300x260?text=No+Image';
    const newPrice = parseFloat(product.newPrice || product.new_price || 0);
    const oldPrice = parseFloat(product.oldPrice || product.old_price || 0);

    return `
        <div class="product-card"
             data-product-id="${product.id}"
             data-new="${product.isNew || false}"
             data-topseller="${product.topSeller || false}"
             onclick="viewProduct(${product.id})">
            ${product.isOffer ? '<div class="product-badge">SALE</div>' : ''}
            <div class="product-image">
                <img src="${imageUrl}"
                     alt="${(product[nameKey] || product.name_en || 'Product').replace(/"/g, '&quot;')}"
                     loading="lazy"
                     onerror="this.onerror=null;this.src='https://placehold.co/300x260?text=No+Image'">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product[nameKey] || product.name_en}</h3>
                
                <div class="product-price">
                    <span class="price-new" data-base-price="${newPrice}">
                        ${formatPrice(newPrice)}
                    </span>
                    ${oldPrice && oldPrice !== newPrice
            ? `<span class="price-old" data-base-price="${oldPrice}">${formatPrice(oldPrice)}</span>`
            : ''}
                </div>
                <div class="product-actions">
                    <button class="btn"
                            onclick="event.stopPropagation(); addToCart(${product.id})"
                            data-en="Add to Cart"
                            data-ar="أضف للسلة">Add to Cart</button>
                    <button class="btn btn-fav ${isInFavorites(product.id) ? 'active' : ''}"
                            onclick="event.stopPropagation(); toggleFavorite(${product.id})">♥</button>
                </div>
            </div>
        </div>
    `;
}

// ==================== LOAD HOMEPAGE PRODUCTS ====================

async function reloadHomeProducts() {
    try {
        const products = await getProducts();
        // ✅ ADD THIS DEBUG CODE:
        console.log('=== DEBUG HOME PRODUCTS ===');
        console.log('Total products from API:', products.length);
        console.log('Products:', products);
        console.log('Filtering for top sellers...');
        const topSellers = products.filter(p => {
            console.log(`- ${p.name_en}: topSeller=${p.topSeller || p.is_top_seller}, visible=${p.visible || p.is_visible}`);
            return (p.topSeller || p.is_top_seller) && (p.visible !== false && p.is_visible !== false);
        });
        console.log('Top Sellers found:', topSellers.length);
        console.log('===========================');
        // Top Sellers
        const topSellersEl = document.getElementById('topSellers');
        if (topSellersEl) {
            const topSellers = products.filter(p => p.topSeller && p.visible).slice(0, 4);
            topSellersEl.innerHTML = topSellers.map(createProductCard).join('') ||
                '<p style="text-align:center;padding:2rem;">No top sellers yet</p>';
        }

        // Random Products
        const randomEl = document.getElementById('randomProducts');
        if (randomEl) {
            const random = products.filter(p => p.visible).sort(() => 0.5 - Math.random()).slice(0, 4);
            randomEl.innerHTML = random.map(createProductCard).join('') ||
                '<p style="text-align:center;padding:2rem;">No products available</p>';
        }

        // Offers
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

// Load homepage products if on homepage
if (document.getElementById('topSellers')) {
    reloadHomeProducts();
}

// ==================== HERO SLIDER ====================

(function initSlider() {
    let currentSlide = 0;
    let autoplayInterval = null;
    const autoplayDelay = 5000;

    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.getElementById('dotsContainer');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const sliderWrapper = document.querySelector('.slider-wrapper');

    if (!slides.length || !dotsContainer) return;

    console.log('✅ Slider initialized with', slides.length, 'slides');

    function createDots() {
        dotsContainer.innerHTML = '';
        slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        });
    }

    function updateDots() {
        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        if (index >= slides.length) currentSlide = 0;
        else if (index < 0) currentSlide = slides.length - 1;
        else currentSlide = index;
        slides[currentSlide].classList.add('active');
        updateDots();
    }

    function nextSlide() { showSlide(currentSlide + 1); }
    function prevSlide() { showSlide(currentSlide - 1); }
    function goToSlide(index) { showSlide(index); resetAutoplay(); }

    function startAutoplay() {
        autoplayInterval = setInterval(nextSlide, autoplayDelay);
    }

    function stopAutoplay() {
        if (autoplayInterval) {
            clearInterval(autoplayInterval);
            autoplayInterval = null;
        }
    }

    function resetAutoplay() {
        stopAutoplay();
        startAutoplay();
    }

    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetAutoplay(); });
    if (sliderWrapper) {
        sliderWrapper.addEventListener('mouseenter', stopAutoplay);
        sliderWrapper.addEventListener('mouseleave', startAutoplay);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { prevSlide(); resetAutoplay(); }
        else if (e.key === 'ArrowRight') { nextSlide(); resetAutoplay(); }
    });

    createDots();
    showSlide(0);
    startAutoplay();

    console.log('🎉 Slider running!');
})();

// ==================== PRODUCT FILTERING ====================

function filterProducts(category) {
    console.log('Filtering products:', category);

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

// ==================== NAVIGATION ====================

function viewProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}

// ==================== INITIALIZATION ====================

window.addEventListener('DOMContentLoaded', async () => {
    // Load preferences
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

    // Load categories
    await loadCategoriesMenu();
    await loadHeaderCategories();

    // Update cart count
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }

    console.log('✅ App initialized');
});

console.log('✅ app.js loaded - Using database for products and categories');

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

            // Render all products
            grid.innerHTML = products.map(createProductCard).join('');

            // Update product count
            updateProductCount();

            // Re-apply language
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