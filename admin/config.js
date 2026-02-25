// ==================== ADMIN CONFIG ====================
// Single source of truth for the backend API URL.
// This file is loaded first in admin/index.html.
// To switch environments, change ONLY this file.

const API_BASE_URL = 'https://primejo-ecommerce-backend-demo.up.railway.app';

// Make available globally
window.API_BASE_URL = API_BASE_URL;
window.API_URL      = API_BASE_URL;   // legacy alias used in some files

console.log('🔧 Admin config loaded — API:', API_BASE_URL);
