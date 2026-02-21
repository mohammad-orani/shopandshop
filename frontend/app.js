// Language Management
let currentLanguage = 'en';
let currentCurrency = 'USD';
const API_URL = 'https://primejo-ecommerce-backend-demo.up.railway.app/api';
// Currency exchange rates (update these regularly or use an API)
const currencyRates = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JOD: 0.71,
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

    // Update all elements with data-base-price (no re-render needed)
    document.querySelectorAll('[data-base-price]').forEach(el => {
        const base = parseFloat(el.getAttribute('data-base-price'));
        if (!isNaN(base)) el.textContent = formatPrice(base);
    });

    // Re-render products grid
    if (document.getElementById('topbaicProductsGrid') && typeof renderProductsPage === 'function') {
        renderProductsPage();
    }

    // Re-render homepage sections
    if (document.getElementById('topSellers')) {
        reloadHomeProducts();
    }

    // Other pages
    if (typeof loadCartItems === 'function') loadCartItems();
    if (typeof loadOrderSummary === 'function') loadOrderSummary();
    if (typeof loadProductDetails === 'function') loadProductDetails();
    if (typeof loadCategoryProducts === 'function') loadCategoryProducts();
    if (typeof loadFavorites === 'function') loadFavorites();
}

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
        } else if (element.tagName === 'OPTION') {
            element.textContent = translation;
        } else {
            element.textContent = translation;
        }
    });

    // Update breadcrumb if it exists
    const breadcrumb = document.getElementById('breadcrumb-current');
    if (breadcrumb) {
        const breadcrumbText = lang === 'ar' ? breadcrumb.getAttribute('data-ar') : breadcrumb.getAttribute('data-en');
        if (breadcrumbText) {
            breadcrumb.textContent = breadcrumbText;
        }
    }

    localStorage.setItem('preferredLanguage', lang);
}

// Load preferred language on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    switchLanguage(savedLang);

    // Load preferred currency
    const savedCurrency = localStorage.getItem('preferredCurrency') || 'JOD';
    currentCurrency = savedCurrency;
    const currencySelector = document.getElementById('currencySelector');
    if (currencySelector) {
        currencySelector.value = savedCurrency;
    }

    // Load categories into navigation menu
    loadCategoriesMenu();
});

// Load categories into navigation dropdown
function loadCategoriesMenu() {
    const menuContainer = document.getElementById('dynamicCategoryMenu');
    if (!menuContainer) return;

    // Get categories from admin (same storage as admin panel)
    const categoriesData = localStorage.getItem('categories');
    if (!categoriesData) return;

    const categories = JSON.parse(categoriesData);
    if (categories.length === 0) return;

    // Keep "All Products" as first item
    let menuHTML = '<li><a href="category.html" data-en="All Products" data-ar="جميع المنتجات">All Products</a></li>';

    // Add each category
    categories.forEach(cat => {
        menuHTML += `<li><a href="category.html?cat=${cat.id}" data-en="${cat.name_en}" data-ar="${cat.name_ar}">${cat.name_en}</a></li>`;
    });

    menuContainer.innerHTML = menuHTML;

    // Re-apply language to new menu items
    switchLanguage(currentLanguage);
}

// Initialize empty products array if none exists
if (!localStorage.getItem('products')) {
    localStorage.setItem('products', JSON.stringify([]));
}

// Get products from storage
function getProducts() {
    return JSON.parse(localStorage.getItem('products')) || [];
}

// Display product card
function createProductCard(product) {
    const nameKey = `name_${currentLanguage}`;
    const descKey = `description_${currentLanguage}`;

    const imageUrl = product.image ||
        product.image_url ||
        'https://placehold.co/300x260?text=No+Image';

    const newPrice = product.newPrice || product.new_price || 0;
    const oldPrice = product.oldPrice || product.old_price || 0;

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
                <p class="product-description">${product[descKey] || product.description_en || ''}</p>
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

// Load products on homepage
if (document.getElementById('topSellers')) {
    const products = getProducts();
    const topSellers = products.filter(p => p.topSeller).slice(0, 4);
    document.getElementById('topSellers').innerHTML = topSellers.map(createProductCard).join('');

    const randomProducts = products.sort(() => 0.5 - Math.random()).slice(0, 4);
    document.getElementById('randomProducts').innerHTML = randomProducts.map(createProductCard).join('');

    const offers = products.filter(p => p.isOffer).slice(0, 4);
    document.getElementById('offerProducts').innerHTML = offers.map(createProductCard).join('');

    // Re-translate after loading products
    switchLanguage(currentLanguage);
}

// ==================== HERO SLIDER ====================

(function () {
    // Configuration
    let currentSlide = 0;
    let autoplayInterval = null;
    const autoplayDelay = 5000; // 5 seconds

    // Get elements
    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.getElementById('dotsContainer');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const sliderWrapper = document.querySelector('.slider-wrapper');

    // Exit if no slider found
    if (!slides.length || !dotsContainer) {
        return;
    }

    console.log('✅ Slider initialized with', slides.length, 'slides');

    // Create dots
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

    // Update active dot
    function updateDots() {
        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            if (index === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    // Show slide
    function showSlide(index) {
        // Remove active from all slides
        slides.forEach(slide => slide.classList.remove('active'));

        // Handle wrap around
        if (index >= slides.length) {
            currentSlide = 0;
        } else if (index < 0) {
            currentSlide = slides.length - 1;
        } else {
            currentSlide = index;
        }

        // Add active to current slide
        slides[currentSlide].classList.add('active');
        updateDots();
    }

    // Next slide
    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    // Previous slide
    function prevSlide() {
        showSlide(currentSlide - 1);
    }

    // Go to specific slide
    function goToSlide(index) {
        showSlide(index);
        resetAutoplay();
    }

    // Start autoplay
    function startAutoplay() {
        autoplayInterval = setInterval(nextSlide, autoplayDelay);
    }

    // Stop autoplay
    function stopAutoplay() {
        if (autoplayInterval) {
            clearInterval(autoplayInterval);
            autoplayInterval = null;
        }
    }

    // Reset autoplay
    function resetAutoplay() {
        stopAutoplay();
        startAutoplay();
    }

    // Event listeners
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            resetAutoplay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            resetAutoplay();
        });
    }

    // Pause on hover
    if (sliderWrapper) {
        sliderWrapper.addEventListener('mouseenter', stopAutoplay);
        sliderWrapper.addEventListener('mouseleave', startAutoplay);
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
            resetAutoplay();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
            resetAutoplay();
        }
    });

    // Initialize
    createDots();
    showSlide(0);
    startAutoplay();

    console.log('🎉 Slider fully initialized and running!');

})();

// ==================== PRODUCT FILTERING & BREADCRUMB ====================

function filterProducts(category) {
    console.log('Filtering products:', category);

    // Update active button state
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.classList.remove('active');

        // Find and activate the clicked button
        const btnOnClick = btn.getAttribute('onclick');
        if (btnOnClick && btnOnClick.includes(`'${category}'`)) {
            btn.classList.add('active');

            // Update breadcrumb
            updateBreadcrumb(btn);
        }
    });

    // Get all product cards
    const products = document.querySelectorAll('.product-card');

    // Show/hide products based on filter
    products.forEach(product => {
        if (category === 'all') {
            product.style.display = 'block';
        } else if (category === 'new') {
            // Show only new arrivals
            if (product.classList.contains('new-arrival') ||
                product.dataset.new === 'true') {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        } else if (category === 'topseller') {
            // Show only top sellers
            if (product.classList.contains('top-seller') ||
                product.dataset.topSeller === 'true') {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        }
    });

    // Update product count
    updateProductCount();
}

// Update breadcrumb text
function updateBreadcrumb(button) {
    const breadcrumbElement = document.getElementById('breadcrumb-current');

    if (!breadcrumbElement || !button) return;

    // Add transition effect
    breadcrumbElement.classList.add('updating');

    setTimeout(() => {
        // Get breadcrumb text from button
        const breadcrumbTextEn = button.getAttribute('data-en');
        const breadcrumbTextAr = button.getAttribute('data-ar');

        // Update breadcrumb attributes
        breadcrumbElement.setAttribute('data-en', breadcrumbTextEn);
        breadcrumbElement.setAttribute('data-ar', breadcrumbTextAr);

        // Set current language text
        if (currentLanguage === 'ar') {
            breadcrumbElement.textContent = breadcrumbTextAr;
        } else {
            breadcrumbElement.textContent = breadcrumbTextEn;
        }

        // Remove transition effect
        breadcrumbElement.classList.remove('updating');

        console.log('Breadcrumb updated to:', breadcrumbElement.textContent);
    }, 150);
}

// Update product count
function updateProductCount() {
    const productCountElement = document.getElementById('productCount');
    if (!productCountElement) return;

    const visibleProducts = document.querySelectorAll('.product-card[style*="display: block"], .product-card:not([style*="display: none"])');
    const count = visibleProducts.length;

    if (currentLanguage === 'ar') {
        productCountElement.textContent = `عرض ${count} منتج`;
    } else {
        productCountElement.textContent = `Showing ${count} products`;
    }
}

// Cart Management
function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(productId) {
    const cart = getCart();
    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ productId, quantity: 1 });
    }

    saveCart(cart);
    alert(currentLanguage === 'en' ? 'Product added to cart!' : 'تمت إضافة المنتج إلى السلة!');
}

function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countElement = document.getElementById('cartCount');
    if (countElement) {
        countElement.textContent = totalItems;
    }
}

// Favorites Management
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

    // Update UI
    const btn = event.target;
    btn.classList.toggle('active');
}

function viewProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}

// Initialize cart count on page load
updateCartCount();

// Get categories from localStorage
function getCategories() {
    const categoriesData = localStorage.getItem('categories');
    if (categoriesData) {
        return JSON.parse(categoriesData);
    }

    localStorage.setItem('categories', JSON.stringify(defaultCategories));
    return defaultCategories;
}

// Load categories into header dropdown - RUNS ON EVERY PAGE
function loadHeaderCategories() {
    const dropdown = document.getElementById('categoriesDropdown');
    if (!dropdown) return;

    const categories = getCategories();

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

    // Re-apply current language
    if (typeof currentLanguage !== 'undefined' && typeof switchLanguage === 'function') {
        switchLanguage(currentLanguage);
    }
}

// Auto-load categories when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeaderCategories);
} else {
    loadHeaderCategories();
}

// Setup filter button event listeners
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(btn => {
        // Remove any existing listeners first
        btn.replaceWith(btn.cloneNode(true));
    });

    // Re-select after cloning
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const filter = this.getAttribute('data-filter');
            if (filter) {
                console.log('Filter clicked:', filter);
                filterProductsWithPagination(filter, this);
            }
        });
    });

    console.log('✅ Filter buttons initialized');
}
// ✅ Added event listener to currency selector
currencySelector.addEventListener('change', function () {
    changeCurrency(this.value);
});


