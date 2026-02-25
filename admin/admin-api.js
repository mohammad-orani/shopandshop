// ==================== ADMIN-API.JS ====================
// All API calls for the admin panel.
// Reads API_BASE_URL from config.js (loaded before this file).

function getApiUrl() {
    return window.API_BASE_URL
        || window.API_URL
        || 'https://primejo-ecommerce-backend-demo.up.railway.app';
}

function getAuthHeaders() {
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken') || '';
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

async function apiCall(method, path, body = null) {
    const url = `${getApiUrl()}${path}`;
    const options = {
        method,
        headers: getAuthHeaders()
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(url, options);

    // Handle 401 — token expired, redirect to login
    if (res.status === 401) {
        localStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminToken');
        window.location.href = 'login.html';
        return;
    }

    const data = await res.json();
    return data;
}

// ============ AUTH ============

async function adminLogin(email, password) {
    const res = await fetch(`${getApiUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return res.json();
}

// ============ PRODUCTS ============

async function getProducts() {
    const data = await apiCall('GET', '/api/products?visible=false');
    return Array.isArray(data) ? data : [];
}

async function createProduct(productData) {
    return apiCall('POST', '/api/products', productData);
}

async function updateProduct(id, productData) {
    return apiCall('PUT', `/api/products/${id}`, productData);
}

async function deleteProduct(id) {
    return apiCall('DELETE', `/api/products/${id}`);
}

// ============ CATEGORIES ============

async function getCategories() {
    const data = await apiCall('GET', '/api/categories');
    return Array.isArray(data) ? data : [];
}

async function createCategory(categoryData) {
    return apiCall('POST', '/api/categories', categoryData);
}

async function deleteCategory(id) {
    return apiCall('DELETE', `/api/categories/${id}`);
}

// ============ ORDERS ============

async function getOrders(filters = {}) {
    let query = '';
    const params = [];
    if (filters.status)    params.push(`status=${filters.status}`);
    if (filters.from_date) params.push(`from_date=${filters.from_date}`);
    if (filters.to_date)   params.push(`to_date=${filters.to_date}`);
    if (params.length)     query = '?' + params.join('&');

    const data = await apiCall('GET', `/api/orders${query}`);
    return Array.isArray(data) ? data : [];
}

async function getOrderById(orderId) {
    return apiCall('GET', `/api/orders/${orderId}`);
}

async function updateOrderStatus(orderId, newStatus) {
    return apiCall('PATCH', `/api/orders/${orderId}/status`, { order_status: newStatus });
}

// ============ DELIVERY ============

async function getDeliveryCountries() {
    const data = await apiCall('GET', '/api/delivery/countries');
    return data?.countries || [];
}

async function getDeliveryCities(countryId) {
    const data = await apiCall('GET', `/api/delivery/cities/${countryId}`);
    return data?.cities || [];
}

async function createDeliveryCountry(countryData) {
    return apiCall('POST', '/api/delivery/countries', countryData);
}

async function createDeliveryCity(cityData) {
    return apiCall('POST', '/api/delivery/cities', cityData);
}

async function updateDeliveryCity(id, cityData) {
    return apiCall('PUT', `/api/delivery/cities/${id}`, cityData);
}

async function deleteDeliveryCity(id) {
    return apiCall('DELETE', `/api/delivery/cities/${id}`);
}

async function deleteDeliveryCountry(id) {
    return apiCall('DELETE', `/api/delivery/countries/${id}`);
}

// ============ GENERAL INFO ============

async function getGeneralInfo() {
    const data = await apiCall('GET', '/api/general-info');
    return data?.info || data || {};
}

async function updateGeneralInfo(infoData) {
    return apiCall('PUT', '/api/general-info', infoData);
}

// ============ STATS ============

async function getStats() {
    return apiCall('GET', '/api/stats');
}