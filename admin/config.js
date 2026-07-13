// ==================== ADMIN BRAND & API CONFIGURATION ====================
// Single source of truth for the admin panel's brand identity and backend URL.
// Keep these values in sync with frontend/config.js when re-branding.

// ==================== ENVIRONMENT-AWARE API URL ====================
// Local development (Live Server, VS Code, direct file testing on localhost)
// automatically talks to a local backend; every other host uses production.
(function () {
    var DEV_API_URL  = 'http://localhost:3000/api';
    var PROD_API_URL = 'https://shopandshop-production.up.railway.app/api';
    var isDev = ['localhost', '127.0.0.1', ''].indexOf(window.location.hostname) !== -1;

    // Only assign to window — no const, to avoid "already declared" conflict with api files
    window.API_URL = isDev ? DEV_API_URL : PROD_API_URL;
})();

window.BRAND = {
    name: 'Shop and Shop',
    slug: 'shop-and-shop',
    favicon: {
        svg: '../frontend/assets/brand/favicon.svg',
        icon: '../frontend/assets/brand/icon.svg'
    },
    title: 'Admin Panel - Shop and Shop'
};

// ==================== APPLY BRAND TO THE CURRENT PAGE ====================
(function () {
    // Injects the favicon: an SVG icon (scales to any size in modern browsers)
    // plus a larger square icon for apple-touch-icon / home-screen use.
    function applyBrandFavicon() {
        var brand = window.BRAND;
        var favicon = brand && brand.favicon;
        if (!favicon) return;

        document.querySelectorAll('link[data-brand-favicon]').forEach(function (el) {
            el.parentNode.removeChild(el);
        });

        function addLink(rel, href, type) {
            if (!href) return;
            var link = document.createElement('link');
            link.rel = rel;
            link.href = href;
            if (type) link.type = type;
            link.setAttribute('data-brand-favicon', '');
            document.head.appendChild(link);
        }

        addLink('icon', favicon.svg, 'image/svg+xml');
        addLink('apple-touch-icon', favicon.icon);
    }

    // Replaces the {{BRAND_NAME}} token used in static HTML (titles, sidebar
    // heading, form placeholders) so a single name change in BRAND.name
    // propagates everywhere without editing every admin page.
    function applyBrandTokens() {
        var brand = window.BRAND;
        if (!brand) return;
        var name = brand.name;

        if (document.title.indexOf('{{BRAND_NAME}}') !== -1) {
            document.title = document.title.split('{{BRAND_NAME}}').join(name);
        }

        var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        var textNodes = [];
        var node;
        while ((node = walker.nextNode())) {
            if (node.nodeValue.indexOf('{{BRAND_NAME}}') !== -1) textNodes.push(node);
        }
        textNodes.forEach(function (n) {
            n.nodeValue = n.nodeValue.split('{{BRAND_NAME}}').join(name);
        });

        document.querySelectorAll('[placeholder*="{{BRAND_NAME}}"]').forEach(function (el) {
            el.setAttribute('placeholder', el.getAttribute('placeholder').split('{{BRAND_NAME}}').join(name));
        });
    }

    function applyBrand() {
        applyBrandFavicon();
        if (document.body) applyBrandTokens();
    }

    window.applyBrand = applyBrand;

    applyBrandFavicon();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyBrand);
    } else {
        applyBrand();
    }
})();
