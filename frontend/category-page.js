/**
 * Category Page Logic
 * Handles category banners, product filtering, and TOP BAIC style display
 */

// Get categories from localStorage (database)
function getCategories() {
    const categoriesData = localStorage.getItem('categories');
    if (categoriesData) {
        return JSON.parse(categoriesData);
    }
    
    // Default categories if none exist
    // const defaultCategories = [
    //     {
    //         id: 'exterior',
    //         name_en: 'Exterior Accessories',
    //         name_ar: 'إكسسوارات خارجية',
    //         description_en: 'Premium exterior upgrades for your vehicle',
    //         description_ar: 'ترقيات خارجية مميزة لسيارتك',
    //         image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop'
    //     },
    //     {
    //         id: 'interior',
    //         name_en: 'Interior Accessories',
    //         name_ar: 'إكسسوارات داخلية',
    //         description_en: 'Enhance your driving comfort and style',
    //         description_ar: 'عزز راحتك وأناقتك أثناء القيادة',
    //         image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop'
    //     },
    //     {
    //         id: 'lighting',
    //         name_en: 'Lighting',
    //         name_ar: 'الإضاءة',
    //         description_en: 'LED lights and premium lighting solutions',
    //         description_ar: 'مصابيح LED وحلول إضاءة مميزة',
    //         image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop'
    //     },
    //     {
    //         id: 'performance',
    //         name_en: 'Performance Parts',
    //         name_ar: 'قطع الأداء',
    //         description_en: 'Boost your vehicle performance',
    //         description_ar: 'عزز أداء سيارتك',
    //         image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
    //     },
    //     {
    //         id: 'wheels',
    //         name_en: 'Wheels & Tires',
    //         name_ar: 'العجلات والإطارات',
    //         description_en: 'Premium wheels and high-performance tires',
    //         description_ar: 'عجلات مميزة وإطارات عالية الأداء',
    //         image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop'
    //     },
    //     {
    //         id: 'electronics',
    //         name_en: 'Electronics',
    //         name_ar: 'الإلكترونيات',
    //         description_en: 'Advanced electronics and smart accessories',
    //         description_ar: 'إلكترونيات متقدمة وإكسسوارات ذكية',
    //         image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&h=600&fit=crop'
    //     }
    // ];
    
    localStorage.setItem('categories', JSON.stringify(defaultCategories));
    return defaultCategories;
}

// Load categories into header dropdown
function loadCategoriesDropdown() {
    const categories = getCategories();
    const dropdown = document.getElementById('categoriesDropdownHeader');
    
    if (!dropdown) return;
    
    let html = '<a href="category.html" class="all-categories" data-en="All Categories" data-ar="جميع الفئات">All Categories</a>';
    
    categories.forEach(cat => {
        html += `
            <a href="category.html?cat=${cat.id}" data-en="${cat.name_en}" data-ar="${cat.name_ar}">
                ${cat.name_en}
            </a>
        `;
    });
    
    dropdown.innerHTML = html;
}

// Count products per category
function countCategoryProducts(categoryId) {
    const products = getProducts();
    return products.filter(p => p.category === categoryId).length;
}

// Load category banners
function loadCategoryBanners() {
    const categories = getCategories();
    const grid = document.getElementById('categoryBannersGrid');
    
    if (!grid) return;
    
    grid.innerHTML = categories.map(cat => {
        const count = countCategoryProducts(cat.id);
        return `
            <div class="category-banner scroll-reveal" onclick="window.location.href='category.html?cat=${cat.id}'">
                <img src="${cat.image}" alt="${cat.name_en}" class="category-banner-image">
                <div class="category-banner-overlay">
                    <h3 class="category-banner-title" data-en="${cat.name_en}" data-ar="${cat.name_ar}">${cat.name_en}</h3>
                    <p class="category-banner-count" data-en="${count} Products" data-ar="${count} منتج">${count} Products</p>
                </div>
            </div>
        `;
    }).join('');
    
    // Apply language
    if (typeof switchLanguage === 'function') {
        switchLanguage(currentLanguage || 'en');
    }
}

// Current filter and category
let currentCategoryFilter = 'all';
let currentCategoryId = null;

// Load single category products
function loadCategoryProducts(categoryId) {
    const categories = getCategories();
    const category = categories.find(c => c.id === categoryId);
    
    if (!category) {
        // Category not found, show all categories
        document.getElementById('categoryBannersSection').style.display = 'block';
        document.getElementById('categoryProductsSection').style.display = 'none';
        loadCategoryBanners();
        return;
    }
    
    currentCategoryId = categoryId;
    
    // Hide banners, show products
    document.getElementById('categoryBannersSection').style.display = 'none';
    document.getElementById('categoryProductsSection').style.display = 'block';
    
    // Update breadcrumb
    const breadcrumb = document.getElementById('breadcrumbCategory');
    breadcrumb.setAttribute('data-en', category.name_en);
    breadcrumb.setAttribute('data-ar', category.name_ar);
    breadcrumb.textContent = category.name_en;
    
    // Update header
    const title = document.getElementById('categoryTitle');
    title.setAttribute('data-en', category.name_en);
    title.setAttribute('data-ar', category.name_ar);
    title.textContent = category.name_en;
    
    const description = document.getElementById('categoryDescription');
    description.setAttribute('data-en', category.description_en);
    description.setAttribute('data-ar', category.description_ar);
    description.textContent = category.description_en;
    
    // Load products
    const products = getProducts();
    const categoryProducts = products.filter(p => p.category === categoryId);
    
    const count = document.getElementById('categoryCount');
    count.innerHTML = `<span data-en="Showing ${categoryProducts.length} products" data-ar="عرض ${categoryProducts.length} منتج">Showing ${categoryProducts.length} products</span>`;
    
    // Display products
    displayCategoryProducts(categoryProducts);
    
    // Apply language
    if (typeof switchLanguage === 'function') {
        switchLanguage(currentLanguage || 'en');
    }
}

// Display products in grid
function displayCategoryProducts(products) {
    const grid = document.getElementById('categoryProductsGrid');
    
    if (!grid) return;
    
    if (products.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <h2 style="font-size: 24px; margin-bottom: 16px;" data-en="No products found" data-ar="لم يتم العثور على منتجات">No products found</h2>
                <p style="color: #666; margin-bottom: 24px;" data-en="Try adjusting your filters or browse other categories" data-ar="حاول تعديل المرشحات أو تصفح فئات أخرى">Try adjusting your filters or browse other categories</p>
                <a href="category.html" style="display: inline-block; padding: 12px 32px; background: #1a1a1a; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;" data-en="View All Categories" data-ar="عرض جميع الفئات">View All Categories</a>
            </div>
        `;
    } else {
        // Use TOP BAIC product card style
        grid.innerHTML = products.map(product => createTopBaicProductCard(product)).join('');
    }
    
    // Re-apply language
    if (typeof switchLanguage === 'function') {
        switchLanguage(currentLanguage || 'en');
    }
}

// Filter category products
function filterCategoryProducts(filter) {
    currentCategoryFilter = filter;
    
    if (!currentCategoryId) return;
    
    const products = getProducts();
    let filtered = products.filter(p => p.category === currentCategoryId);
    
    switch(filter) {
        case 'new':
            filtered = filtered.filter(p => p.isNew);
            break;
        case 'topseller':
            filtered = filtered.filter(p => p.isTopSeller || p.topSeller);
            break;
        case 'all':
        default:
            // Already filtered by category
            break;
    }
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Display filtered products
    displayCategoryProducts(filtered);
}

// Sort category products
function sortCategoryProducts(sortBy) {
    if (!currentCategoryId) return;
    
    const products = getProducts();
    let sorted = products.filter(p => p.category === currentCategoryId);
    
    // Apply current filter
    switch(currentCategoryFilter) {
        case 'new':
            sorted = sorted.filter(p => p.isNew);
            break;
        case 'topseller':
            sorted = sorted.filter(p => p.isTopSeller || p.topSeller);
            break;
    }
    
    // Sort
    switch(sortBy) {
        case 'price-low':
            sorted.sort((a, b) => a.newPrice - b.newPrice);
            break;
        case 'price-high':
            sorted.sort((a, b) => b.newPrice - a.newPrice);
            break;
        case 'name':
            sorted.sort((a, b) => a.name_en.localeCompare(b.name_en));
            break;
        case 'featured':
        default:
            // Keep original order
            break;
    }
    
    // Display sorted products
    displayCategoryProducts(sorted);
}

// Initialize category page
function initCategoryPage() {
    // Load categories into dropdown
    loadCategoriesDropdown();
    
    // Check URL for category parameter
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('cat');
    
    if (categoryId) {
        // Show single category
        loadCategoryProducts(categoryId);
    } else {
        // Show all categories as banners
        document.getElementById('categoryBannersSection').style.display = 'block';
        document.getElementById('categoryProductsSection').style.display = 'none';
        loadCategoryBanners();
    }
    
    // Update cart count
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
}

// Run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCategoryPage);
} else {
    initCategoryPage();
}
