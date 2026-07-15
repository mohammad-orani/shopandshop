// ==================== FRONTEND BRAND & API CONFIGURATION ====================
// Single source of truth for brand identity, theme, and backend connectivity.
// To white-label this storefront for a new brand, edit ONLY the values below —
// no other file should need a hardcoded brand name, logo, or color.
//
// This file must load before header.js/footer.js/general-info.js on every page
// (see script tag order in each .html file) so window.BRAND is defined in time.

// ==================== ENVIRONMENT-AWARE API URL ====================
// Local development (Live Server, VS Code, direct file testing on localhost)
// automatically talks to a local backend; every other host uses production.
// Override either URL below if your local backend runs on a different port.
(function () {
    var DEV_API_URL  = 'http://localhost:3000/api';
    var PROD_API_URL = 'https://shopandshop-production.up.railway.app/api';
    var isDev = ['localhost', '127.0.0.1', ''].indexOf(window.location.hostname) !== -1;

    // Only assign to window — no const, to avoid "already declared" conflict with api.js
    window.API_URL = isDev ? DEV_API_URL : PROD_API_URL;
})();

window.BRAND = {
    name: 'Shop and Shop',
    nameAr: 'شوب اند شوب',
    slug: 'Shop and Shop',
    // TODO: replace with the real production domain before launch — used for
    // canonical URLs, Open Graph/Twitter og:url, and JSON-LD. Also update the
    // {{SITE_URL}} occurrences in sitemap.xml/robots.txt (those are static
    // files and can't read this value).
    siteUrl: 'https://www.example.com',
    logo: 'assets/brand/logo.svg',
    logoWhite: 'assets/brand/logo-white.svg',
    logoBlack: 'assets/brand/logo-black.svg',
    // SVG favicon (scales cleanly in modern browsers) + a larger square icon
    // used for the apple-touch-icon / home-screen tile.
    favicon: {
        svg: 'assets/brand/favicon.svg',
        icon: 'assets/brand/icon.svg'
    },

    // Used as the fallback <title> / meta description when a page doesn't
    // define its own — page-specific titles use the {{BRAND_NAME}} token instead.
    title: 'Shop and Shop - Premium E-Commerce | Everything you\'re looking for is here',
    metaDescription: 'Quality products, secure checkout. Shop Shop and Shop - Your trusted marketplace.',

    // Fallback contact info shown before the general-info API responds.
    // The live values are admin-editable via the general_info DB table.
    contact: {
        phone: '+962786215022',
        email: 'Info@shopandshop.online',
        whatsapp: '+962786215022'
    },

    // Fallback social links (also admin-editable via general_info — see general-info.js,
    // which overwrites/hides these based on the [data-social] attribute at runtime).
    social: {
        instagram: 'https://www.instagram.com/prime_jo2026/',
        facebook: 'https://web.facebook.com/profile.php?id=61585873581631',
        snapchat: 'https://snapchat.com/add/primejo',
        tiktok: 'https://tiktok.com/@primejo',
        youtube: 'https://youtube.com/@primejo'
    },

    // Mirrors the legacy variable bridge in design-system.css (section 2).
    // These are set as inline styles on <html>, which beats any stylesheet
    // rule — so they MUST match design-system.css's bridge values, or this
    // will silently win over the CSS and re-introduce the old palette.
    // Kept only for pages/scripts that read window.BRAND.theme directly;
    // design-system.css is the actual source of truth for the values.
    theme: {
        primaryDark: '#1F2937',
        primaryBlack: '#1F2937',
        accentGold: '#39B86C',
        accentGoldDark: '#2E9C5C',
        accentBlue: '#14532D'
    }
};

// ==================== APPLY BRAND TO THE CURRENT PAGE ====================
// Runs immediately (config.js is not deferred-order-sensitive for this part —
// it only touches the DOM, and is called again on DOMContentLoaded as a safety net).
(function () {
    function applyBrandTheme() {
        var theme = window.BRAND && window.BRAND.theme;
        if (!theme) return;
        var root = document.documentElement.style;
        if (theme.primaryDark)    root.setProperty('--primary-dark', theme.primaryDark);
        if (theme.primaryBlack)   root.setProperty('--primary-black', theme.primaryBlack);
        if (theme.accentGold)     root.setProperty('--accent-gold', theme.accentGold);
        if (theme.accentGoldDark) root.setProperty('--accent-gold-dark', theme.accentGoldDark);
        if (theme.accentBlue)     root.setProperty('--accent-blue', theme.accentBlue);
    }

    // Injects the favicon: an SVG icon (scales to any size in modern browsers)
    // plus a larger square icon for apple-touch-icon / home-screen use.
    // Safe to call more than once — removes any links it previously added.
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

    // Replaces the {{BRAND_NAME}}/{{SITE_URL}} tokens used in static HTML
    // (titles, meta tags, headings, copyright lines, SEO tags, JSON-LD) so a
    // single name/URL change in BRAND propagates everywhere without editing
    // every page.
    //
    // The brand name is pulled live from the General Info API (single source
    // of truth, admin-editable) — window.BRAND.name is used only as the
    // fallback if that fetch is unavailable (e.g. api.js not loaded on this
    // page) or fails, since getGeneralInfoFromAPI() itself already falls back
    // to window.BRAND internally on network failure. siteUrl has no General
    // Info equivalent (it's a deployment-time constant, not editable store
    // data), so it's intentionally still sourced from the static config.
    async function applyBrandTokens() {
        var brand = window.BRAND;
        if (!brand) return;
        var name = brand.name;
        var siteUrl = brand.siteUrl || '';

        if (typeof getGeneralInfoFromAPI === 'function') {
            var info = await getGeneralInfoFromAPI();
            if (info && info.brand_name) name = info.brand_name;
        }

        function replaceTokens(str) {
            return str.split('{{BRAND_NAME}}').join(name).split('{{SITE_URL}}').join(siteUrl);
        }

        if (document.title.indexOf('{{BRAND_NAME}}') !== -1) {
            document.title = replaceTokens(document.title);
        }
        var metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && metaDesc.content.indexOf('{{BRAND_NAME}}') !== -1) {
            metaDesc.content = replaceTokens(metaDesc.content);
        }

        // Open Graph / Twitter Card meta content, and the canonical link href —
        // attribute values aren't visited by the text-node walker below.
        document.querySelectorAll(
            'meta[property^="og:"][content*="{{"], meta[name^="twitter:"][content*="{{"], link[rel="canonical"][href*="{{"]'
        ).forEach(function (el) {
            if (el.hasAttribute('content')) el.setAttribute('content', replaceTokens(el.getAttribute('content')));
            if (el.hasAttribute('href')) el.setAttribute('href', replaceTokens(el.getAttribute('href')));
        });

        var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        var textNodes = [];
        var node;
        while ((node = walker.nextNode())) {
            if (node.nodeValue.indexOf('{{BRAND_NAME}}') !== -1 || node.nodeValue.indexOf('{{SITE_URL}}') !== -1) textNodes.push(node);
        }
        textNodes.forEach(function (n) {
            n.nodeValue = replaceTokens(n.nodeValue);
        });

        document.querySelectorAll('[data-en*="{{BRAND_NAME}}"], [data-ar*="{{BRAND_NAME}}"]').forEach(function (el) {
            if (el.hasAttribute('data-en')) el.setAttribute('data-en', el.getAttribute('data-en').split('{{BRAND_NAME}}').join(name));
            if (el.hasAttribute('data-ar')) el.setAttribute('data-ar', el.getAttribute('data-ar').split('{{BRAND_NAME}}').join(name));
        });
    }

    function applyBrand() {
        applyBrandTheme();
        applyBrandFavicon();
        if (document.body) applyBrandTokens();
    }

    window.applyBrand = applyBrand;

    // Theme + favicon can run before <body> exists; tokens need <body>.
    applyBrandTheme();
    applyBrandFavicon();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyBrand);
    } else {
        applyBrand();
    }
})();
