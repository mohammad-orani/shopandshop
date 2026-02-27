// ==================== ADMIN API CONFIGURATION ====================

const API_URL = 'https://primejo-ecommerce-backend-demo.up.railway.app/api';

// ==================== AUTH ====================

async function adminLogin(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.token) {
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.user));
            return { success: true, data };
        }

        return { success: false, error: data.error || 'Login failed' };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Connection failed' };
    }
}

function getAdminToken() {
    return localStorage.getItem('adminToken');
}

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAdminToken()}`
    };
}

function adminLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'login.html';
}

// ==================== PRODUCTS ====================

async function getProducts() {
    try {
        const response = await fetch(`${API_URL}/products?visible=false`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

async function createProduct(productData) {
    try {
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(productData)
        });
        return await response.json();
    } catch (error) {
        console.error('Error creating product:', error);
        return { error: 'Failed to create product' };
    }
}

async function updateProduct(id, productData) {
    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(productData)
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating product:', error);
        return { error: 'Failed to update product' };
    }
}

async function deleteProduct(id) {
    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting product:', error);
        return { error: 'Failed to delete product' };
    }
}

// ==================== CATEGORIES ====================

async function getCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

async function createCategory(categoryData) {
    try {
        const response = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(categoryData)
        });
        return await response.json();
    } catch (error) {
        console.error('Error creating category:', error);
        return { error: 'Failed to create category' };
    }
}
async function updateCategory(id, categoryData) {
    try {
        const response = await fetch(`${API_URL}/categories/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(categoryData)
        });
        return await response.json();
    } catch (error) {
        return { error: 'Failed to update category' };
    }
}
async function deleteCategory(id) {
    try {
        const response = await fetch(`${API_URL}/categories/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting category:', error);
        return { error: 'Failed to delete category' };
    }
}

// ==================== ORDERS ====================

async function getOrders(filters = {}) {
    try {
        const params = new URLSearchParams(filters);
        const response = await fetch(`${API_URL}/orders?${params}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

async function updateOrderStatus(id, status) {
    try {
        const response = await fetch(`${API_URL}/orders/${id}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ order_status: status })
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating order:', error);
        return { error: 'Failed to update order' };
    }
}

// ==================== DELIVERY ====================

async function getDeliveryCountries() {
    try {
        const response = await fetch(`${API_URL}/delivery/countries`);
        const data = await response.json();
        return data.countries || [];
    } catch (error) {
        console.error('Error fetching countries:', error);
        return [];
    }
}

async function getDeliveryCities(countryId) {
    try {
        const response = await fetch(`${API_URL}/delivery/cities/${countryId}`);
        const data = await response.json();
        return data.cities || [];
    } catch (error) {
        console.error('Error fetching cities:', error);
        return [];
    }
}

async function createCountry(countryData) {
    try {
        const response = await fetch(`${API_URL}/delivery/countries`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(countryData)
        });
        return await response.json();
    } catch (error) {
        console.error('Error creating country:', error);
        return { error: 'Failed to create country' };
    }
}

async function updateCountry(id, countryData) {
    try {
        const response = await fetch(`${API_URL}/delivery/countries/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(countryData)
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating country:', error);
        return { error: 'Failed to update country' };
    }
}

async function createCity(cityData) {
    try {
        const response = await fetch(`${API_URL}/delivery/cities`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(cityData)
        });
        return await response.json();
    } catch (error) {
        console.error('Error creating city:', error);
        return { error: 'Failed to create city' };
    }
}

async function updateCity(id, cityData) {
    try {
        const response = await fetch(`${API_URL}/delivery/cities/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(cityData)
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating city:', error);
        return { error: 'Failed to update city' };
    }
}

// ==================== GENERAL INFO ====================

async function getGeneralInfo() {
    try {
        const response = await fetch(`${API_URL}/general-info`);
        const data = await response.json();
        return data.info || null;
    } catch (error) {
        console.error('Error fetching general info:', error);
        return null;
    }
}

async function updateGeneralInfo(infoData) {
    try {
        const response = await fetch(`${API_URL}/general-info`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(infoData)
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating general info:', error);
        return { error: 'Failed to update general info' };
    }
}

// ==================== STATS ====================

async function getStats() {
    try {
        const response = await fetch(`${API_URL}/stats`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching stats:', error);
        return {};
    }
}