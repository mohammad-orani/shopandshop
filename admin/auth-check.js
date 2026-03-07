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

    // ── JWT expiry check ──
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = payload.exp - now;

        if (payload.exp && now >= payload.exp) {
            console.warn('⚠️ Token expired. Redirecting to login...');
            _clearAuth();
            window.location.href = 'login.html?reason=expired';
            return;
        }

        // Auto-logout when token expires during active session
        if (expiresIn > 0) {
            setTimeout(function () {
                alert('⚠️ Your session has expired. Please log in again.');
                _clearAuth();
                window.location.href = 'login.html?reason=expired';
            }, expiresIn * 1000);
        }

    } catch (e) {
        console.warn('Could not decode token, proceeding anyway.');
    }

    // Sync token to both storages
    localStorage.setItem('adminToken', token);
    sessionStorage.setItem('adminToken', token);

    console.log('✅ Admin authenticated');
})();

// ── Intercept 401 responses globally ──
// Any API call returning 401 will auto-logout immediately
(function interceptFetch() {
    const _origFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await _origFetch(...args);
        if (response.status === 401) {
            console.warn('⚠️ 401 Unauthorized — session expired.');
            _clearAuth();
            alert('Your session has expired. Please log in again.');
            window.location.href = 'login.html?reason=expired';
        }
        return response;
    };
})();

function _clearAuth() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
}

function adminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        _clearAuth();
        window.location.href = 'login.html';
    }
}

window.adminLogout = adminLogout;
window._clearAuth  = _clearAuth;