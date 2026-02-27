// ==================== AUTH CHECK FOR ADMIN PAGES ====================
// Add this script to EVERY admin page (before other scripts)

(function checkAuth() {
    if (window.location.pathname.includes('login.html')) return;

    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');

    if (!token) {
        console.warn('⚠️ No admin token found. Redirecting to login...');
        window.location.href = 'login.html';
        return;
    }

    // Sync token to both storages so all scripts can find it
    localStorage.setItem('adminToken', token);
    sessionStorage.setItem('adminToken', token);

    console.log('✅ Admin authenticated');
})();

// Logout function
function adminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminUser');
        window.location.href = 'login.html';
    }
}

window.adminLogout = adminLogout;