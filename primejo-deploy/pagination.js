// ==================== PAGINATION SYSTEM ====================

// Pagination configuration
const PRODUCTS_PER_PAGE = 12; // Change this to show more/less products per page
let currentPage = 1;
let currentFilter = 'all';
let allProducts = [];
let filteredProducts = [];

// Initialize pagination
function initPagination() {
    allProducts = getProducts();
    filteredProducts = allProducts;
    currentPage = 1;
    // Setup filter buttons FIRST
    setupFilterButtons();
    loadProductsPage();
    renderPagination();
}

// Load products for current page
function loadProductsPage() {
    const grid = document.getElementById('topbaicProductsGrid');
    if (!grid) return;

    // Calculate start and end index
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;

    // Get products for current page
    const pageProducts = filteredProducts.slice(startIndex, endIndex);

    console.log(`Loading page ${currentPage}: showing products ${startIndex + 1} to ${Math.min(endIndex, filteredProducts.length)} of ${filteredProducts.length}`);

    // Display products
    if (pageProducts.length === 0) {
        grid.innerHTML = `
            <div class="no-products">
                <p data-en="No products found" data-ar="لا توجد منتجات">No products found</p>
            </div>
        `;
    } else {
        grid.innerHTML = pageProducts.map(createProductCard).join('');
    }

    // Re-apply language
    if (typeof switchLanguage === 'function') {
        switchLanguage(currentLanguage);
    }

    // Scroll to top of products
    const productsSection = document.querySelector('.topbaic-products');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Render pagination buttons
function renderPagination() {
    const paginationContainer = document.querySelector('.topbaic-pagination');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

    console.log(`Total pages: ${totalPages}, Current page: ${currentPage}`);

    // If no products or only 1 page, hide pagination
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    } else {
        paginationContainer.style.display = 'flex';
    }

    let paginationHTML = '';

    // Previous button
    paginationHTML += `
        <button class="pagination-btn" 
                onclick="goToPage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''}>
            ‹
        </button>
    `;

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page + ellipsis
    if (startPage > 1) {
        paginationHTML += `
            <button class="pagination-btn" onclick="goToPage(1)">1</button>
        `;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                    onclick="goToPage(${i})">
                ${i}
            </button>
        `;
    }

    // Ellipsis + last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `
            <button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>
        `;
    }

    // Next button
    paginationHTML += `
        <button class="pagination-btn" 
                onclick="goToPage(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''}>
            ›
        </button>
    `;

    paginationContainer.innerHTML = paginationHTML;
}

// Go to specific page
function goToPage(page) {
    const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

    // Validate page number
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    loadProductsPage();
    renderPagination();
}

// Update filter and reset to page 1
function filterProductsWithPagination(category, button) {
    console.log('🔍 Filtering products:', category);

    // Prevent any default behavior
    event?.preventDefault();
    event?.stopPropagation();

    currentFilter = category;
    currentPage = 1;

    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (button) {
        button.classList.add('active');
        updateBreadcrumb(button);
    }

    // Filter products based on category
    if (category === 'all') {
        filteredProducts = allProducts;
    } else if (category === 'new') {
        filteredProducts = allProducts.filter(p => p.isNew === true);
    } else if (category === 'topseller') {
        filteredProducts = allProducts.filter(p => p.topSeller === true);
    }

    console.log(`✅ Filtered: ${filteredProducts.length} of ${allProducts.length} products`);

    // Reload products
    loadProductsPage();
    renderPagination();
    updateProductCount();
}

// Update product count display
function updateProductCount() {
    const productCountElement = document.getElementById('productCount');
    if (!productCountElement) return;

    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
    const endIndex = Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length);
    const total = filteredProducts.length;

    if (currentLanguage === 'ar') {
        productCountElement.innerHTML = `
            <span data-en="Showing ${startIndex}-${endIndex} of ${total} products" 
                  data-ar="عرض ${startIndex}-${endIndex} من ${total} منتج">
                عرض ${startIndex}-${endIndex} من ${total} منتج
            </span>
        `;
    } else {
        productCountElement.innerHTML = `
            <span data-en="Showing ${startIndex}-${endIndex} of ${total} products" 
                  data-ar="عرض ${startIndex}-${endIndex} من ${total} منتج">
                Showing ${startIndex}-${endIndex} of ${total} products
            </span>
        `;
    }
}

// Initialize when page loads
if (document.getElementById('topbaicProductsGrid')) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPagination);
    } else {
        initPagination();
    }
}

// Make function globally available
window.goToPage = goToPage;
window.filterProductsWithPagination = filterProductsWithPagination;