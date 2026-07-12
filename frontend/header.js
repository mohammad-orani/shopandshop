/**
 * ============================================================
 *  PRIMEJO - SHARED HEADER COMPONENT
 *  File: header.js
 * ============================================================
 */

(function () {

    var brand = window.BRAND || {};
    var logoSrc = brand.logo || 'assets/brand/logo.png';
    var brandName = brand.name || 'Store';

    var headerHTML = '<header class="topbaic-header">' +
        '<div class="header-main">' +
        '<div class="header-main-inner">' +
        '<a href="index.html" style="display:inline-block;line-height:0;">' +
        '<img src="' + logoSrc + '" alt="' + brandName + '" loading="eager" style="height:80px;width:auto;object-fit:contain;display:block;">' +
        '</a>' +
        '<button class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="Open menu" aria-expanded="false">&#9776;</button>' +
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
        '<button class="icon-btn" onclick="window.location.href=\'favorites.html\'" title="Favorites" aria-label="Favorites">\u2764\ufe0f</button>' +
        '<button class="icon-btn" onclick="window.location.href=\'cart.html\'" title="Cart" aria-label="Cart">' +
        '\uD83D\uDED2<span class="icon-badge" id="cartCount">0</span>' +
        '</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="mobile-menu-overlay" id="mobileMenuOverlay"></div>' +
        '</header>';

    var searchBarHTML =
        '<div class="primejo-search-bar" id="primejoSearchBar">' +
            '<div class="search-bar-inner">' +
                '<div class="search-input-wrap">' +
                    '<span class="search-icon">&#128269;</span>' +
                    '<input type="text" id="primejoSearchInput" ' +
                           'placeholder="\u0627\u0628\u062d\u062b \u0639\u0646 \u0645\u0646\u062a\u062c... / Search products..." ' +
                           'aria-label="Search products" ' +
                           'autocomplete="off" />' +
                    '<button class="search-clear" id="searchClear" aria-label="Clear search" style="display:none;">&#10005;</button>' +
                '</div>' +
                '<div class="search-dropdown" id="searchDropdown"></div>' +
            '</div>' +
        '</div>';

    // Inject header
    var placeholder = document.getElementById('site-header');
    if (placeholder) {
        placeholder.outerHTML = headerHTML;
    } else {
        document.body.insertAdjacentHTML('afterbegin', headerHTML);
    }

    // Inject search bar right after the header
    var headerEl = document.querySelector('.topbaic-header');
    if (headerEl) {
        headerEl.insertAdjacentHTML('afterend', searchBarHTML);
    }

    // ── Mobile menu ──
    var toggle = document.getElementById('mobileMenuToggle');
    var nav = document.getElementById('mobileNav');
    var overlay = document.getElementById('mobileMenuOverlay');

    function openMenu() {
        nav.classList.add('active');
        if (overlay) overlay.classList.add('active');
        toggle.innerHTML = '&#10005;';
        toggle.setAttribute('aria-label', 'Close menu');
        toggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        nav.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        toggle.innerHTML = '&#9776;';
        toggle.setAttribute('aria-label', 'Open menu');
        toggle.setAttribute('aria-expanded', 'false');
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

    // ── Search logic ──
    var allProducts = [];
    var searchTimeout = null;

    function initSearch() {
        var input = document.getElementById('primejoSearchInput');
        var dropdown = document.getElementById('searchDropdown');
        var clearBtn = document.getElementById('searchClear');
        if (!input) return;

        // Pre-load products for instant results
        if (typeof getProducts === 'function') {
            getProducts().then(function (p) { allProducts = p || []; }).catch(function () {});
        }

        input.addEventListener('input', function () {
            var q = this.value.trim();
            clearBtn.style.display = q ? 'block' : 'none';
            clearTimeout(searchTimeout);
            if (!q) { hideDropdown(); return; }
            searchTimeout = setTimeout(function () { showResults(q); }, 200);
        });

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                var q = this.value.trim();
                if (q) goToProductsPage(q);
            }
            if (e.key === 'Escape') hideDropdown();
        });

        clearBtn.addEventListener('click', function () {
            input.value = '';
            clearBtn.style.display = 'none';
            hideDropdown();
            input.focus();
        });

        document.addEventListener('click', function (e) {
            if (!e.target.closest('.search-bar-inner')) hideDropdown();
        });
    }

    function showResults(query) {
        var dropdown = document.getElementById('searchDropdown');
        if (!dropdown) return;

        var lang = (typeof currentLanguage !== 'undefined' ? currentLanguage : 'en');
        var nameKey = 'name_' + lang;
        var q = query.toLowerCase();

        var matches = allProducts.filter(function (p) {
            return (p[nameKey] || p.name_en || '').toLowerCase().includes(q) ||
                   (p.name_en || '').toLowerCase().includes(q) ||
                   (p.name_ar || '').toLowerCase().includes(q);
        }).slice(0, 6);

        if (matches.length === 0) {
            dropdown.innerHTML = '<div class="search-no-results">&#128269; ' +
                (lang === 'ar' ? '\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c' : 'No results found') +
                '</div>';
            dropdown.classList.add('visible');
            return;
        }

        var items = matches.map(function (p) {
            var name = p[nameKey] || p.name_en || '';
            var price = parseFloat(p.new_price || p.newPrice || 0).toFixed(2);
            var img = p.image_url || p.image || 'https://placehold.co/52x52?text=?';
            var highlighted = name.replace(
                new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'),
                '<mark>$1</mark>'
            );
            var safeName = name.replace(/"/g, '&quot;');
            return '<div class="search-result-item" role="button" tabindex="0" aria-label="' + safeName + '" ' +
                'onclick="window.location.href=\'product.html?id=' + p.id + '\'" ' +
                'onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();window.location.href=\'product.html?id=' + p.id + '\';}">' +
                '<img class="search-result-img" src="' + img + '" alt="' + name + '" loading="lazy" ' +
                     'onerror="this.src=\'https://placehold.co/52x52?text=?\'">' +
                '<div class="search-result-info">' +
                    '<div class="search-result-name">' + highlighted + '</div>' +
                    '<div class="search-result-price">' + price + ' JOD</div>' +
                '</div>' +
            '</div>';
        }).join('');

        var viewAllLabel = lang === 'ar'
            ? '\u0639\u0631\u0636 \u0643\u0644 \u0627\u0644\u0646\u062a\u0627\u0626\u062c \u0644\u0640 "' + query + '" \u2190'
            : 'View all results for &quot;' + query + '&quot; &rarr;';

        var viewAllQuery = query.replace(/'/g, "\\'");
        var viewAll = '<div class="search-view-all" role="button" tabindex="0" ' +
            'onclick="goToProductsPage(\'' + viewAllQuery + '\')" ' +
            'onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();goToProductsPage(\'' + viewAllQuery + '\');}">' +
            viewAllLabel + '</div>';

        dropdown.innerHTML = items + viewAll;
        dropdown.classList.add('visible');
    }

    function hideDropdown() {
        var dropdown = document.getElementById('searchDropdown');
        if (dropdown) dropdown.classList.remove('visible');
    }

    window.goToProductsPage = function (query) {
        window.location.href = 'products.html?search=' + encodeURIComponent(query);
    };

    // Init search after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearch);
    } else {
        setTimeout(initSearch, 150);
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

    // ── Show search bar on scroll UP, hide on scroll DOWN ──
    var lastScrollY = window.scrollY;

    window.addEventListener('scroll', function () {
        var currentScrollY = window.scrollY;
        var searchBar = document.getElementById('primejoSearchBar');
        if (!searchBar) return;

        if (currentScrollY < lastScrollY) {
            // Scrolling UP — show
            searchBar.classList.remove('search-hidden');
            searchBar.classList.add('search-visible');
        } else if (currentScrollY > 80) {
            // Scrolling DOWN past 80px — hide
            searchBar.classList.remove('search-visible');
            searchBar.classList.add('search-hidden');
        }

        lastScrollY = currentScrollY;
    });

    console.log('✅ Header loaded');
})();