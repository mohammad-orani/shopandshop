/**
 * ============================================================
 *  PRIMEJO - SHARED HEADER COMPONENT
 *  File: header.js
 * ============================================================
 */

(function () {

    var headerHTML = '<header class="topbaic-header">' +
        '<div class="header-main">' +
            '<div class="header-main-inner">' +
                '<button class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="Open menu">&#9776;</button>' +
                '<a href="index.html" class="topbaic-logo"><img src="Prime_Jo_Logo.png" alt="PrimeJo" style="height:50px;width:auto;object-fit:contain;"></a>' +
                '<nav class="topbaic-nav" id="mobileNav">' +
                    '<a href="index.html" data-en="Home" data-ar="\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629">Home</a>' +
                    '<div class="nav-item" id="navCategories">' +
                        '<span data-en="Categories" data-ar="\u0627\u0644\u0641\u0626\u0627\u062a">Categories <span class="dropdown-arrow">&#9660;</span></span>' +
                        '<div class="categories-dropdown" id="categoriesDropdown"></div>' +
                    '</div>' +
                    '<a href="about.html" data-en="About" data-ar="\u0645\u0646 \u0646\u062d\u0646">About</a>' +
                    '<a href="contact.html" data-en="Contact" data-ar="\u0627\u062a\u0635\u0644 \u0628\u0646\u0627">Contact</a>' +
                '</nav>' +
                '<div class="header-icons">' +
                    '<button class="icon-btn" onclick="window.location.href=\'favorites.html\'" title="Favorites">\u2764\ufe0f</button>' +
                    '<button class="icon-btn" onclick="window.location.href=\'cart.html\'" title="Cart">' +
                        '\uD83D\uDED2<span class="icon-badge" id="cartCount">0</span>' +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="mobile-menu-overlay" id="mobileMenuOverlay"></div>' +
    '</header>';

    // Inject
    var placeholder = document.getElementById('site-header');
    if (placeholder) {
        placeholder.outerHTML = headerHTML;
    } else {
        document.body.insertAdjacentHTML('afterbegin', headerHTML);
    }

    // ── Mobile menu ──
    var toggle  = document.getElementById('mobileMenuToggle');
    var nav     = document.getElementById('mobileNav');
    var overlay = document.getElementById('mobileMenuOverlay');

    function openMenu() {
        nav.classList.add('active');
        if (overlay) overlay.classList.add('active');
        toggle.innerHTML = '&#10005;';
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        nav.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        toggle.innerHTML = '&#9776;';
        document.body.style.overflow = '';
    }

    if (toggle && nav) {
        toggle.addEventListener('click', function () {
            nav.classList.contains('active') ? closeMenu() : openMenu();
        });
        if (overlay) overlay.addEventListener('click', closeMenu);
        nav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', closeMenu);
        });

        // ── Categories tap-to-toggle on mobile ──
        var catItem = document.getElementById('navCategories');
        if (catItem) {
            var catSpan = catItem.querySelector('span');
            if (catSpan) {
                catSpan.addEventListener('click', function () {
                    catItem.classList.toggle('open');
                });
            }
        }

        console.log('✅ Mobile menu ready');
    }

    // Currency selector
    document.addEventListener('DOMContentLoaded', function () {
        var sel = document.getElementById('currencySelector');
        if (!sel) return;
        var saved = localStorage.getItem('preferredCurrency') || 'JOD';
        sel.value = saved;
        sel.addEventListener('change', function () {
            if (typeof changeCurrency === 'function') changeCurrency(this.value);
        });
    });

    console.log('✅ Header loaded');
})();