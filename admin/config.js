// ==================== ADMIN BRAND & API CONFIGURATION ====================
// Single source of truth for the admin panel's brand identity and backend URL.
// Keep these values in sync with frontend/config.js when re-branding.

// ==================== ENVIRONMENT-AWARE API URL ====================
// Local development (Live Server, VS Code, direct file testing on localhost)
// automatically talks to a local backend; every other host uses production.
(function () {
    var DEV_API_URL  = 'http://localhost:3000/api';
    var PROD_API_URL = 'https://primejo-ecommerce-backend-demo.up.railway.app/api';
    var isDev = ['localhost', '127.0.0.1', ''].indexOf(window.location.hostname) !== -1;

    // Only assign to window — no const, to avoid "already declared" conflict with api files
    window.API_URL = isDev ? DEV_API_URL : PROD_API_URL;
})();

window.BRAND = {
    name: 'PrimeJo',
    slug: 'primejo',
    favicon: {
        ico: '../frontend/assets/brand/favicon.ico',
        png32: '../frontend/assets/brand/favicon-32.png',
        png192: '../frontend/assets/brand/favicon-192.png'
    },
    title: 'Admin Panel - PrimeJo'
};

// ==================== APPLY BRAND TO THE CURRENT PAGE ====================
(function () {
    // Injects the full favicon set: a classic .ico (older browsers / OS
    // bookmarks) plus sized PNGs (modern browsers, PWA/home-screen icons).
    function applyBrandFavicon() {
        var brand = window.BRAND;
        var favicon = brand && brand.favicon;
        if (!favicon) return;

        document.querySelectorAll('link[data-brand-favicon]').forEach(function (el) {
            el.parentNode.removeChild(el);
        });

        function addLink(rel, href, sizes, type) {
            if (!href) return;
            var link = document.createElement('link');
            link.rel = rel;
            link.href = href;
            if (sizes) link.setAttribute('sizes', sizes);
            if (type) link.type = type;
            link.setAttribute('data-brand-favicon', '');
            document.head.appendChild(link);
        }

        addLink('icon', favicon.ico, undefined, 'image/x-icon');
        addLink('icon', favicon.png32, '32x32', 'image/png');
        addLink('icon', favicon.png192, '192x192', 'image/png');
        addLink('apple-touch-icon', favicon.png192);
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
