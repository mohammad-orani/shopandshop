// Admin API Service
// This file handles all admin panel communication with the backend API

const API_URL = 'http://localhost:3000/api';

// Check if we should use API or localStorage
const USE_API = true; // Set to false to use localStorage (demo mode)

// ========================================
// CATEGORIES
// ========================================

async function getCategoriesAPI() {
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

async function addCategoryAPI(category) {
    if (!USE_API) {
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        categories.push(category);
        localStorage.setItem('categories', JSON.stringify(categories));
        return { success: true, category };
    }
    
    try {
        const response = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(category)
        });
        
        if (!response.ok) throw new Error('Failed to add category');
        return await response.json();
    } catch (error) {
        console.error('Error adding category:', error);
        // Fallback to localStorage
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        categories.push(category);
        localStorage.setItem('categories', JSON.stringify(categories));
        return { success: true, category };
    }
}

async function deleteCategoryAPI(id) {
    if (!USE_API) {
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        const updated = categories.filter(cat => cat.id !== id);
        localStorage.setItem('categories', JSON.stringify(updated));
        return { success: true };
    }
    
    try {
        const response = await fetch(`${API_URL}/categories/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete category');
        return await response.json();
    } catch (error) {
        console.error('Error deleting category:', error);
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        const updated = categories.filter(cat => cat.id !== id);
        localStorage.setItem('categories', JSON.stringify(updated));
        return { success: true };
    }
}

// ========================================
// PRODUCTS
// ========================================

async function getProductsAPI() {
    if (!USE_API) {
        return JSON.parse(localStorage.getItem('products') || '[]');
    }
    
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        return data.products || [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return JSON.parse(localStorage.getItem('products') || '[]');
    }
}

async function addProductAPI(product) {
    if (!USE_API) {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        product.id = Date.now();
        products.push(product);
        localStorage.setItem('products', JSON.stringify(products));
        return { success: true, product };
    }
    
    try {
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        
        if (!response.ok) throw new Error('Failed to add product');
        return await response.json();
    } catch (error) {
        console.error('Error adding product:', error);
        // Fallback to localStorage
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        product.id = Date.now();
        products.push(product);
        localStorage.setItem('products', JSON.stringify(products));
        return { success: true, product };
    }
}

async function updateProductAPI(id, product) {
    if (!USE_API) {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const index = products.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            products[index] = { ...products[index], ...product, id: parseInt(id) };
            localStorage.setItem('products', JSON.stringify(products));
        }
        return { success: true, product };
    }
    
    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        
        if (!response.ok) throw new Error('Failed to update product');
        return await response.json();
    } catch (error) {
        console.error('Error updating product:', error);
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const index = products.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            products[index] = { ...products[index], ...product, id: parseInt(id) };
            localStorage.setItem('products', JSON.stringify(products));
        }
        return { success: true, product };
    }
}

async function deleteProductAPI(id) {
    if (!USE_API) {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const updated = products.filter(p => p.id !== parseInt(id));
        localStorage.setItem('products', JSON.stringify(updated));
        return { success: true };
    }
    
    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete product');
        return await response.json();
    } catch (error) {
        console.error('Error deleting product:', error);
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const updated = products.filter(p => p.id !== parseInt(id));
        localStorage.setItem('products', JSON.stringify(updated));
        return { success: true };
    }
}

// ========================================
// ORDERS
// ========================================

async function getOrdersAPI(filters = {}) {
    if (!USE_API) {
        return JSON.parse(localStorage.getItem('orders') || '[]');
    }
    
    try {
        let url = `${API_URL}/orders`;
        const params = new URLSearchParams();
        
        if (filters.status) params.append('status', filters.status);
        if (filters.from_date) params.append('from_date', filters.from_date);
        if (filters.to_date) params.append('to_date', filters.to_date);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        return data.orders || [];
    } catch (error) {
        console.error('Error fetching orders:', error);
        return JSON.parse(localStorage.getItem('orders') || '[]');
    }
}

async function updateOrderStatusAPI(orderId, status) {
    if (!USE_API) {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const order = orders.find(o => o.orderId === orderId);
        if (order) {
            order.status = status;
            localStorage.setItem('orders', JSON.stringify(orders));
        }
        return { success: true };
    }
    
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) throw new Error('Failed to update order status');
        return await response.json();
    } catch (error) {
        console.error('Error updating order status:', error);
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const order = orders.find(o => o.orderId === orderId);
        if (order) {
            order.status = status;
            localStorage.setItem('orders', JSON.stringify(orders));
        }
        return { success: true };
    }
}

// ========================================
// STATISTICS
// ========================================

async function getStatsAPI() {
    if (!USE_API) {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        
        const totalProducts = products.length;
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        
        return {
            totalProducts,
            totalOrders,
            pendingOrders,
            totalRevenue: totalRevenue.toFixed(2)
        };
    }
    
    try {
        const response = await fetch(`${API_URL}/stats`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        return await response.json();
    } catch (error) {
        console.error('Error fetching stats:', error);
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        
        return {
            totalProducts: products.length,
            totalOrders: orders.length,
            pendingOrders: orders.filter(o => o.status === 'pending').length,
            totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)
        };
    }
}

// Export API functions
window.AdminAPI = {
    // Categories
    getCategories: getCategoriesAPI,
    addCategory: addCategoryAPI,
    deleteCategory: deleteCategoryAPI,
    
    // Products
    getProducts: getProductsAPI,
    addProduct: addProductAPI,
    updateProduct: updateProductAPI,
    deleteProduct: deleteProductAPI,
    
    // Orders
    getOrders: getOrdersAPI,
    updateOrderStatus: updateOrderStatusAPI,
    
    // Stats
    getStats: getStatsAPI,
    
    // Mode
    USE_API: USE_API
};

// Also export for backward compatibility
window.getProducts = getProductsAPI;
window.getCategories = getCategoriesAPI;
window.saveProducts = (products) => {
    if (!USE_API) {
        localStorage.setItem('products', JSON.stringify(products));
    }
};
window.saveCategories = (categories) => {
    if (!USE_API) {
        localStorage.setItem('categories', JSON.stringify(categories));
    }
};
