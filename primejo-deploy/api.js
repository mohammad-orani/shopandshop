// Frontend API Service
// This file handles all communication with the backend API

const API_URL = 'https://primejo-backend-demo.up.railway.app/api';

// Check if we should use API or localStorage
const USE_API = true; // Set to false to use localStorage (demo mode)

// ========================================
// PRODUCTS
// ========================================

// Load products from API
async function getProductsFromAPI() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

async function getProductByIdFromAPI(id) {
    if (!USE_API) {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        return products.find(p => p.id === parseInt(id));
    }

    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        const data = await response.json();
        return data.product;
    } catch (error) {
        console.error('Error fetching product:', error);
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        return products.find(p => p.id === parseInt(id));
    }
}

// ========================================
// CATEGORIES
// ========================================

async function getCategoriesFromAPI() {
    if (!USE_API) {
        return JSON.parse(localStorage.getItem('categories') || '[]');
    }

    try {
        const response = await fetch(`${API_URL}/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        return data.categories || [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return JSON.parse(localStorage.getItem('categories') || '[]');
    }
}

// ========================================
// ORDERS
// ========================================

async function createOrderAPI(orderData) {
    if (!USE_API) {
        // Save to localStorage
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(orderData);
        localStorage.setItem('orders', JSON.stringify(orders));
        return { success: true, order: orderData };
    }

    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) throw new Error('Failed to create order');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating order:', error);
        // Fallback to localStorage
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(orderData);
        localStorage.setItem('orders', JSON.stringify(orders));
        return { success: true, order: orderData };
    }
}

// ========================================
// FAVORITES
// ========================================

async function addToFavoritesAPI(productId) {
    // Favorites stay in localStorage for now (user-specific)
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

// ========================================
// CART (stays in localStorage - session-based)
// ========================================

function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(productId, quantity = 1) {
    const cart = getCart();
    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ productId, quantity });
    }

    saveCart(cart);
    updateCartCount();
    return true;
}

function removeFromCart(productId) {
    const cart = getCart();
    const updatedCart = cart.filter(item => item.productId !== productId);
    saveCart(updatedCart);
    updateCartCount();
}

function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countElement = document.getElementById('cartCount');
    if (countElement) {
        countElement.textContent = totalItems;
    }
}

// ========================================
// INITIALIZE
// ========================================

// Update cart count on page load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        updateCartCount();
    });
}

// Export API functions
window.API = {
    // Products
    getProducts: getProductsFromAPI,
    getProductById: getProductByIdFromAPI,

    // Categories
    getCategories: getCategoriesFromAPI,

    // Orders
    createOrder: createOrderAPI,

    // Favorites
    addToFavorites: addToFavoritesAPI,
    removeFromFavorites: removeFromFavoritesAPI,
    getFavorites: getFavoritesAPI,

    // Cart (localStorage)
    getCart: getCart,
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    saveCart: saveCart,
    updateCartCount: updateCartCount
};

// Also export for backward compatibility
window.getProducts = getProductsFromAPI;
window.getCategories = getCategoriesFromAPI;
window.getCart = getCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.saveCart = saveCart;
