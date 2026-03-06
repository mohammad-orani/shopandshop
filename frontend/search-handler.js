/**
 * PRIMEJO - Search Query Handler
 * Add this to products.html (or include as search-handler.js)
 * Reads ?search= from URL and filters the products grid automatically
 */

document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(window.location.search);
    var searchQuery = params.get('search');
    if (!searchQuery) return;

    // Pre-fill the search input if visible on products page
    var input = document.getElementById('primejoSearchInput');
    if (input) {
        input.value = searchQuery;
        input.dispatchEvent(new Event('input'));
    }

    // Wait for products grid to be ready, then filter
    var attempts = 0;
    var interval = setInterval(function () {
        var grid = document.getElementById('topbaicProductsGrid');
        attempts++;
        if (attempts > 20) { clearInterval(interval); return; } // give up after 2s

        if (grid && grid.children.length > 0 && !grid.querySelector('p')) {
            clearInterval(interval);
            filterBySearchQuery(searchQuery);
        }
    }, 100);
});

function filterBySearchQuery(query) {
    var grid = document.getElementById('topbaicProductsGrid');
    if (!grid || typeof getProducts !== 'function') return;

    var q = query.toLowerCase();
    var lang = (typeof currentLanguage !== 'undefined' ? currentLanguage : 'en');

    getProducts().then(function (products) {
        var filtered = products.filter(function (p) {
            return (p.name_en || '').toLowerCase().includes(q) ||
                   (p.name_ar || '').toLowerCase().includes(q);
        });

        if (filtered.length === 0) {
            grid.innerHTML = '<p style="text-align:center;padding:3rem;color:#999;" ' +
                'data-en="No products found for &quot;' + query + '&quot;" ' +
                'data-ar="\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0646\u062a\u062c\u0627\u062a \u0644\u0640 &quot;' + query + '&quot;">' +
                'No products found for &quot;' + query + '&quot;</p>';
        } else {
            var createFn = (window.TopBaic && window.TopBaic.createProductCard)
                ? window.TopBaic.createProductCard
                : (typeof createTopBaicProductCard === 'function' ? createTopBaicProductCard : null);

            if (!createFn) return;
            grid.innerHTML = filtered.map(function (p) { return createFn(p); }).join('');
        }

        if (typeof switchLanguage === 'function') switchLanguage(lang);

        // Update count label if present
        var countEl = document.getElementById('productCount');
        if (countEl) {
            countEl.innerHTML = '<span data-en="Found ' + filtered.length + ' results for &quot;' + query + '&quot;" ' +
                'data-ar="\u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 ' + filtered.length + ' \u0646\u062a\u064a\u062c\u0629">' +
                'Found ' + filtered.length + ' results for &quot;' + query + '&quot;</span>';
        }
    }).catch(function (err) {
        console.error('filterBySearchQuery error:', err);
    });
}
