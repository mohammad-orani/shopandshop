// ==================== FRONTEND API SERVICE ====================
// Handles all communication with the backend API
// Uses Railway MySQL database via backend endpoints

// API_URL is defined in config.js — loaded before this script in every HTML page
const API_URL = window.API_URL || 'https://primejo-ecommerce-backend-demo.up.railway.app/api';

// ==================== PRODUCTS ====================

// In-memory cache: survives page JS execution but resets on navigation
let _productsCache = null;
let _productsCacheTs = 0;
const _CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getProductsFromAPI() {
    const now = Date.now();
    if (_productsCache && (now - _productsCacheTs) < _CACHE_TTL) {
        return _productsCache;
    }
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        const result = Array.isArray(data) ? data : [];
        _productsCache = result;
        _productsCacheTs = now;
        return result;
    } catch (error) {
        console.error('Error fetching products:', error);
        return _productsCache || [];
    }
}

async function getProductByIdFromAPI(id) {
    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        if (!response.ok) throw new Error('Product not found');
        const data = await response.json();
        return data.product || data;
    } catch (error) {
        console.error('❌ Error fetching product:', error);
        return null;
    }
}

// ==================== CATEGORIES ====================

async function getCategoriesFromAPI() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        return Array.isArray(data) ? data : (data.categories || []);
    } catch (error) {
        console.error('❌ Error fetching categories:', error);
        return [];
    }
}

// ==================== ORDERS ====================

async function createOrderAPI(orderData) {
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create order');
        }

        const data = await response.json();
        console.log('✅ Order created:', data);
        return data;

    } catch (error) {
        console.error('❌ Error creating order:', error);
        return { success: false, error: error.message };
    }
}

// ==================== DELIVERY ====================

async function getDeliveryCountries() {
    try {
        const response = await fetch(`${API_URL}/delivery/countries`);
        if (!response.ok) throw new Error('Failed to fetch countries');
        const data = await response.json();
        
        // Map database fields to frontend format
        const countries = (data.countries || []).map(c => ({
            id: c.id,
            name_en: c.name_en || c.country_name_en,
            name_ar: c.name_ar || c.country_name_ar,
            phone_prefix: c.phone_prefix,
            delivery_fee: parseFloat(c.default_fee || 0),
            is_active: c.is_active
        }));
        
        return countries;
    } catch (error) {
        console.error('❌ Error fetching countries:', error);
        return [];
    }
}

async function getDeliveryCities(countryId) {
    try {
        const response = await fetch(`${API_URL}/delivery/cities/${countryId}`);
        if (!response.ok) throw new Error('Failed to fetch cities');
        const data = await response.json();
        
        // Map database fields to frontend format
        const cities = (data.cities || []).map(c => ({
            id: c.id,
            country_id: c.country_id,
            name_en: c.name_en || c.city_name_en,
            name_ar: c.name_ar || c.city_name_ar,
            delivery_fee: parseFloat(c.displayed_fee || c.delivery_fee || 0),
            actual_fee: parseFloat(c.actual_fee || 0),
            is_active: c.is_active
        }));
        
        return cities;
    } catch (error) {
        console.error('❌ Error fetching cities:', error);
        return [];
    }
}

// ==================== FAVORITES ====================
// Favorites stored in localStorage (user-specific, no login required)

async function addToFavoritesAPI(productId) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (!favorites.includes(productId)) {
        favorites.push(productId);
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }
    return { success: true };
}

async function removeFromFavoritesAPI(productId) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const updated = favorites.filter(id => id !== productId);
    localStorage.setItem('favorites', JSON.stringify(updated));
    return { success: true };
}

async function getFavoritesAPI() {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
}

// ==================== CART ====================
// Cart stored in localStorage (session-based, cleared on order)

function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(productId, quantity = 1, tierPrice = null) {
    const cart = getCart();
    if (tierPrice !== null) {
        // Tier item: accumulate on existing entry for this product
        const existingIndex = cart.findIndex(item => String(item.productId) === String(productId));
        if (existingIndex >= 0) {
            cart[existingIndex].quantity += quantity;
            cart[existingIndex].tierPrice += tierPrice;
        } else {
            cart.push({ productId, quantity, tierPrice });
        }
    } else {
        const existingItem = cart.find(item => String(item.productId) === String(productId));
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ productId, quantity });
        }
    }
    saveCart(cart);
    updateCartCount();
    return true;
}

function removeFromCart(productId) {
    const cart = getCart();
    const updatedCart = cart.filter(item => String(item.productId) !== String(productId));
    saveCart(updatedCart);
    updateCartCount();
}

function updateCartItemQuantity(productId, quantity) {
    const cart = getCart();
    const item = cart.find(i => String(i.productId) === String(productId));
    if (item) {
        item.quantity = Math.max(1, quantity);
        saveCart(cart);
        updateCartCount();
    }
}

function clearCart() {
    localStorage.removeItem('cart');
    updateCartCount();
}

function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countElements = document.querySelectorAll('#cartCount, .cart-count');
    countElements.forEach(el => {
        if (el) el.textContent = totalItems;
    });
}

// ==================== GENERAL INFO ====================

async function getGeneralInfoFromAPI() {
    try {
        const response = await fetch(`${API_URL}/general-info`);
        if (!response.ok) throw new Error('Failed to fetch general info');
        const data = await response.json();
        return data.info || data;
    } catch (error) {
        console.error('❌ Error fetching general info:', error);
        return {
            brand_name: 'PrimeJo',
            phone_number: '+962786215022',
            email_address: 'Info@primejo.store',
            minimum_order_amount: 25
        };
    }
}

// ==================== HELPER FUNCTIONS ====================

// Get products for display (handles both DB formats)
async function getProducts() {
    const products = await getProductsFromAPI();
    
    
    const processed = products.map(p => {
        // ✅ Convert MySQL TINYINT (0/1) to JavaScript boolean using !!
        const visible = !!(p.visible || p.is_visible);
        const isNew = !!(p.isNew || p.is_new);
        const topSeller = !!(p.topSeller || p.is_top_seller);
        const isOffer = !!(p.isOffer || p.is_offer);
        
        return {
            id: p.id,
            name_en: p.name_en,
            name_ar: p.name_ar,
            description_en: p.description_en,
            description_ar: p.description_ar,
            category: p.category || p.category_id,
            newPrice: parseFloat(p.newPrice || p.new_price || 0),
            oldPrice: parseFloat(p.oldPrice || p.old_price || 0),
            image: p.image || p.image_url,
            stock: p.stock || 0,
            quantity_to_sell: p.quantity_to_sell || p.quantityToSell || 0,
            quantityToSell: p.quantity_to_sell || p.quantityToSell || 0,
            additional_images: p.additional_images || p.additionalImages || [], // ✅ Database field
            additionalImages: p.additional_images || p.additionalImages || [],   // ✅ Frontend field
            video_url: p.video_url || p.videoUrl || '',
            videoUrl: p.video_url || p.videoUrl || '',
            visible: visible,
            isNew: isNew,
            topSeller: topSeller,
            isOffer: isOffer,
            quantity_tiers: (() => {
                try {
                    const t = p.quantity_tiers;
                    if (!t) return null;
                    return typeof t === 'string' ? JSON.parse(t) : t;
                } catch (e) { return null; }
            })()
        };
    });
    
    return processed;
}

// Get categories
async function getCategories() {
    return await getCategoriesFromAPI();
}

// ==================== INITIALIZE ====================

// Update cart count on page load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        updateCartCount();
    });
}

// ==================== GLOBAL EXPORTS ====================

// Export as window.API object (modern approach)
window.API = {
    // Products
    getProducts: getProducts,
    getProductById: getProductByIdFromAPI,
    getProductsFromAPI: getProductsFromAPI,

    // Categories
    getCategories: getCategories,
    getCategoriesFromAPI: getCategoriesFromAPI,

    // Orders
    createOrder: createOrderAPI,

    // Delivery
    getDeliveryCountries: getDeliveryCountries,
    getDeliveryCities: getDeliveryCities,

    // Favorites
    addToFavorites: addToFavoritesAPI,
    removeFromFavorites: removeFromFavoritesAPI,
    getFavorites: getFavoritesAPI,

    // Cart
    getCart: getCart,
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    updateCartItemQuantity: updateCartItemQuantity,
    clearCart: clearCart,
    saveCart: saveCart,
    updateCartCount: updateCartCount,

    // General Info
    getGeneralInfo: getGeneralInfoFromAPI
};

// Export for backward compatibility (old code that uses these directly)
window.getProducts = getProducts;
window.getProductById = getProductByIdFromAPI;
window.getCategories = getCategories;
window.getCart = getCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartItemQuantity = updateCartItemQuantity;
window.clearCart = clearCart;
window.saveCart = saveCart;
window.updateCartCount = updateCartCount;
window.createOrder = createOrderAPI;
window.getDeliveryCountries = getDeliveryCountries;
window.getDeliveryCities = getDeliveryCities;

console.log('✅ API Service initialized - Connected to Railway MySQL');