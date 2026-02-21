// ==================== AUTH CHECK FOR ADMIN PAGES ====================
// Add this script to EVERY admin page (before other scripts)

(function checkAuth() {
    // Check if on login page
    if (window.location.pathname.includes('login.html')) {
        return; // Don't check auth on login page
    }

    // Get token from localStorage
    const token = localStorage.getItem('adminToken');

    if (!token) {
        // No token - redirect to login
        console.warn('⚠️ No admin token found. Redirecting to login...');
        window.location.href = 'login.html';
        return;
    }

    // Token exists - add to all API requests
    console.log('✅ Admin authenticated');
})();

// Logout function
function adminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = 'login.html';
    }
}

// Add logout to window for use in HTML
window.adminLogout = adminLogout;
