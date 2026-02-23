// ==================== MOBILE MENU FUNCTIONALITY ====================
// Works with header.js which already injects #mobileMenuToggle, #mobileNav, #mobileMenuOverlay

(function () {
    function initMobileMenu() {
        // Prevent double init
        if (window._mobileMenuInitialized) return;
        window._mobileMenuInitialized = true;

        const toggle = document.getElementById('mobileMenuToggle');
        const nav = document.getElementById('mobileNav');
        const overlay = document.getElementById('mobileMenuOverlay');

        if (!toggle || !nav) {
            console.warn('Mobile menu elements not found');
            return;
        }

        function openMenu() {
            nav.classList.add('active');
            if (overlay) overlay.classList.add('active');
            toggle.innerHTML = '✕';
            document.body.style.overflow = 'hidden';
        }

        function closeMenu() {
            nav.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            toggle.innerHTML = '☰';
            document.body.style.overflow = '';
        }

        function toggleMenu() {
            nav.classList.contains('active') ? closeMenu() : openMenu();
        }

        toggle.addEventListener('click', toggleMenu);
        if (overlay) overlay.addEventListener('click', closeMenu);

        // Close when a nav link is clicked
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        console.log('✅ Mobile menu initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
        // header.js injects HTML synchronously, but IDs may need a tick
        setTimeout(initMobileMenu, 0);
    }
})();