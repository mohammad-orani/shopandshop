// Language Management
let currentLanguage = 'en';
let currentCurrency = 'USD';

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
    const convertedPrice = (price * currencyRates[currentCurrency]).toFixed(2);
    const symbol = currencySymbols[currentCurrency];
    
    if (currentCurrency === 'JOD' || currentCurrency === 'AED' || currentCurrency === 'SAR') {
        return `${convertedPrice} ${symbol}`;
    }
    return `${symbol}${convertedPrice}`;
}

function changeCurrency(currency) {
    currentCurrency = currency;
    localStorage.setItem('preferredCurrency', currency);
    
    // Update all prices on the page
    updateAllPrices();
}

function updateAllPrices() {
    // This will be called to refresh prices after currency change
    if (typeof loadProducts === 'function') loadProducts();
    if (typeof loadCartItems === 'function') loadCartItems();
    if (typeof loadOrderSummary === 'function') loadOrderSummary();
    if (typeof loadProductDetails === 'function') loadProductDetails();
    if (typeof loadCategoryProducts === 'function') loadCategoryProducts();
    if (typeof loadFavorites === 'function') loadFavorites();
    
    // Reload section-specific content on homepage
    if (document.getElementById('topSellers')) {
        const products = getProducts();
        const topSellers = products.filter(p => p.topSeller).slice(0, 4);
        document.getElementById('topSellers').innerHTML = topSellers.map(createProductCard).join('');
        
        const randomProducts = products.sort(() => 0.5 - Math.random()).slice(0, 4);
        document.getElementById('randomProducts').innerHTML = randomProducts.map(createProductCard).join('');
        
        const offers = products.filter(p => p.isOffer).slice(0, 4);
        document.getElementById('offerProducts').innerHTML = offers.map(createProductCard).join('');
        
        switchLanguage(currentLanguage);
    }
}

function switchLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    // Update active button
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`lang-${lang}`).classList.add('active');
    
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
    
    localStorage.setItem('preferredLanguage', lang);
}

// Load preferred language on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    switchLanguage(savedLang);
    
    // Load preferred currency
    const savedCurrency = localStorage.getItem('preferredCurrency') || 'USD';
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

// Sample Product Data has been removed
// Add products through the Admin Dashboard at admin/index.html

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
    
    return `
        <div class="product-card" onclick="viewProduct(${product.id})">
            ${product.isOffer ? '<div class="product-badge">SALE</div>' : ''}
            <div class="product-image">
                <img src="${product.image}" alt="${product[nameKey]}">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product[nameKey]}</h3>
                <p class="product-description">${product[descKey]}</p>
                <div class="product-price">
                    <span class="price-new">${formatPrice(product.newPrice)}</span>
                    ${product.oldPrice !== product.newPrice ? `<span class="price-old">${formatPrice(product.oldPrice)}</span>` : ''}
                </div>
                <div class="product-actions">
                    <button class="btn" onclick="event.stopPropagation(); addToCart(${product.id})" data-en="Add to Cart" data-ar="أضف للسلة">Add to Cart</button>
                    <button class="btn btn-fav ${isInFavorites(product.id) ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${product.id})">♥</button>
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

// Hero Slider
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');

if (slides.length > 0) {
    // Create dots
    const dotsContainer = document.querySelector('.slider-dots');
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => goToSlide(index);
        dotsContainer.appendChild(dot);
    });

    function changeSlide(direction) {
        slides[currentSlide].classList.remove('active');
        document.querySelectorAll('.dot')[currentSlide].classList.remove('active');
        
        currentSlide = (currentSlide + direction + slides.length) % slides.length;
        
        slides[currentSlide].classList.add('active');
        document.querySelectorAll('.dot')[currentSlide].classList.add('active');
    }

    function goToSlide(index) {
        slides[currentSlide].classList.remove('active');
        document.querySelectorAll('.dot')[currentSlide].classList.remove('active');
        
        currentSlide = index;
        
        slides[currentSlide].classList.add('active');
        document.querySelectorAll('.dot')[currentSlide].classList.add('active');
    }

    // Auto-advance slides
    setInterval(() => changeSlide(1), 5000);
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
    
    // Default categories
    const defaultCategories = [
        {
            id: 'exterior',
            name_en: 'Exterior Accessories',
            name_ar: 'إكسسوارات خارجية',
            description_en: 'Premium exterior upgrades for your vehicle',
            description_ar: 'ترقيات خارجية مميزة لسيارتك',
            image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop'
        },
        {
            id: 'interior',
            name_en: 'Interior Accessories',
            name_ar: 'إكسسوارات داخلية',
            description_en: 'Enhance your driving comfort and style',
            description_ar: 'عزز راحتك وأناقتك أثناء القيادة',
            image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop'
        },
        {
            id: 'lighting',
            name_en: 'Lighting',
            name_ar: 'الإضاءة',
            description_en: 'LED lights and premium lighting solutions',
            description_ar: 'مصابيح LED وحلول إضاءة مميزة',
            image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop'
        },
        {
            id: 'performance',
            name_en: 'Performance Parts',
            name_ar: 'قطع الأداء',
            description_en: 'Boost your vehicle performance',
            description_ar: 'عزز أداء سيارتك',
            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
        },
        {
            id: 'wheels',
            name_en: 'Wheels & Tires',
            name_ar: 'العجلات والإطارات',
            description_en: 'Premium wheels and high-performance tires',
            description_ar: 'عجلات مميزة وإطارات عالية الأداء',
            image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop'
        },
        {
            id: 'electronics',
            name_en: 'Electronics',
            name_ar: 'الإلكترونيات',
            description_en: 'Advanced electronics and smart accessories',
            description_ar: 'إلكترونيات متقدمة وإكسسوارات ذكية',
            image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&h=600&fit=crop'
        }
    ];
    
    localStorage.setItem('categories', JSON.stringify(defaultCategories));
    return defaultCategories;
}

// Load categories into header dropdown - RUNS ON EVERY PAGE
function loadHeaderCategories() {
    const dropdown = document.getElementById('categoriesDropdown');
    if (!dropdown) return;
    
    const categories = getCategories();
    
    let html = '<a href="category.html" class="all-categories" data-en="All Categories" data-ar="جميع الفئات">All Categories</a>';
    
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
