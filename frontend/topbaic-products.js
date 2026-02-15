// ============================================
// TOP BAIC STYLE PRODUCTS RENDERING
// ============================================

// Create TOP BAIC style product card
function createTopBaicProductCard(product) {
    const nameKey = `name_${currentLanguage || 'en'}`;
    const descKey = `description_${currentLanguage || 'en'}`;
    
    // Calculate discount
    const discount = product.oldPrice && product.oldPrice !== product.newPrice 
        ? Math.round(((product.oldPrice - product.newPrice) / product.oldPrice) * 100) 
        : 0;
    
    // Determine stock status
    const availableQty = product.quantityToSell || product.stock || 0;
    let stockClass = 'stock-dot';
    let stockText = 'In Stock';
    let stockTextAr = 'متوفر';
    
    if (availableQty === 0) {
        stockClass = 'stock-dot out';
        stockText = 'Out of Stock';
        stockTextAr = 'غير متوفر';
    } else if (availableQty < 10) {
        stockClass = 'stock-dot low';
        stockText = `Only ${availableQty} left`;
        stockTextAr = `${availableQty} فقط متبقي`;
    }
    
    return `
        <div class="topbaic-product-card product-card scroll-reveal">
            <!-- Image Wrapper -->
            <div class="product-image-wrapper">
                <img src="${product.image}" alt="${product[nameKey]}" class="product-image" loading="lazy">
                
                <!-- Badges -->
                <div class="product-badges">
                    ${product.isNew ? '<span class="badge badge-new">NEW</span>' : ''}
                    ${discount > 0 ? `<span class="badge badge-sale">-${discount}%</span>` : ''}
                    ${product.isTopSeller ? '<span class="badge badge-topseller">TOP SELLER</span>' : ''}
                    ${product.isFeatured ? '<span class="badge badge-limited">LIMITED</span>' : ''}
                </div>
                
                <!-- Quick Actions -->
                <div class="quick-actions">
                    <button class="quick-action-btn" onclick="toggleFavorite(${product.id})" title="Add to Favorites">
                        ❤️
                    </button>
                    <button class="quick-action-btn" onclick="window.location.href='product.html?id=${product.id}'" title="Quick View">
                        👁️
                    </button>
                </div>
                
                <!-- Free Delivery Badge (Overlay) -->
                <div class="topbaic-delivery-banner" style="position: absolute; bottom: 12px; left: 12px; right: 12px; font-size: 11px; padding: 8px 12px;">
                    <span class="delivery-icon">🚚</span>
                    <span data-en="FREE DELIVERY" data-ar="توصيل مجاني">FREE DELIVERY</span>
                </div>
            </div>
            
            <!-- Product Info -->
            <div class="product-info">
                <div class="product-vendor">PRIMEJO PREMIUM</div>
                
                <h3 class="product-title">
                    <a href="product.html?id=${product.id}">${product[nameKey]}</a>
                </h3>
                
                <!-- Rating -->
                <div class="product-rating">
                    <div class="stars">★★★★★</div>
                    <span class="rating-count">(${Math.floor(Math.random() * 50) + 10})</span>
                </div>
                
                <!-- Price -->
                <div class="product-price">
                    <span class="price-current">${formatPrice(product.newPrice)}</span>
                    ${discount > 0 ? `
                        <span class="price-original">${formatPrice(product.oldPrice)}</span>
                        <span class="price-save" data-en="Save ${discount}%" data-ar="وفر ${discount}%">Save ${discount}%</span>
                    ` : ''}
                </div>
                
                <!-- Description -->
                <p class="product-description">${product[descKey] || 'Premium quality automotive accessory designed for superior performance and style.'}</p>
                
                <!-- Stock Status -->
                <div class="stock-status">
                    <span class="${stockClass}"></span>
                    <span data-en="${stockText}" data-ar="${stockTextAr}">${stockText}</span>
                </div>
                
                <!-- Add to Cart Button -->
                <button 
                    class="add-to-cart-btn" 
                    onclick="addToCartTopBaic(${product.id})" 
                    ${availableQty === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                    <span data-en="ADD TO CART" data-ar="أضف للسلة">ADD TO CART</span>
                </button>
            </div>
        </div>
    `;
}

// Add to cart with TOP BAIC style notification
function addToCartTopBaic(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    const cart = getCart();
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ productId, quantity: 1 });
    }
    
    saveCart(cart);
    updateCartCount();
    
    // Show modern toast notification
    if (window.ModernAnimations && window.ModernAnimations.showToast) {
        const nameKey = `name_${currentLanguage || 'en'}`;
        window.ModernAnimations.showToast(
            currentLanguage === 'ar' 
                ? `✓ تمت الإضافة: ${product[nameKey]}` 
                : `✓ Added: ${product[nameKey]}`,
            'success'
        );
    }
}

// Load products in TOP BAIC style
function loadTopBaicProducts() {
    const products = getProducts();
    const grid = document.getElementById('topbaicProductsGrid');
    
    if (!grid) return;
    
    // Show loading skeleton
    if (window.ModernAnimations && window.ModernAnimations.showProductSkeleton) {
        window.ModernAnimations.showProductSkeleton(grid, 8);
    }
    
    // Simulate loading (in real app, this would be an API call)
    setTimeout(() => {
        const productCards = products.map(product => createTopBaicProductCard(product)).join('');
        grid.innerHTML = productCards;
        
        // Update product count
        const countElement = document.getElementById('productCount');
        if (countElement) {
            const countText = currentLanguage === 'ar' 
                ? `عرض ${products.length} منتج` 
                : `Showing ${products.length} products`;
            countElement.innerHTML = `<span>${countText}</span>`;
        }
        
        // Re-apply language
        if (typeof switchLanguage === 'function') {
            switchLanguage(currentLanguage || 'en');
        }
        
        // Initialize scroll reveals
        if (window.ModernAnimations) {
            setTimeout(() => {
                const reveals = document.querySelectorAll('.scroll-reveal');
                reveals.forEach((element, index) => {
                    setTimeout(() => {
                        element.classList.add('revealed');
                    }, index * 100);
                });
            }, 100);
        }
    }, 500);
}

// Filter products
let currentFilter = 'all';
function filterProducts(filter) {
    currentFilter = filter;
    const products = getProducts();
    let filtered = products;
    
    switch(filter) {
        case 'new':
            filtered = products.filter(p => p.isNew);
            break;
        case 'topseller':
            // Filter products marked as top sellers
            filtered = products.filter(p => p.isTopSeller);
            break;
        case 'all':
        default:
            filtered = products;
    }
    
    // Update grid
    const grid = document.getElementById('topbaicProductsGrid');
    if (grid) {
        grid.innerHTML = filtered.map(product => createTopBaicProductCard(product)).join('');
        
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Re-apply language
        if (typeof switchLanguage === 'function') {
            switchLanguage(currentLanguage || 'en');
        }
    }
}

// Sort products
function sortProducts(sortBy) {
    const products = getProducts();
    let sorted = [...products];
    
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
            // Keep original order or sort by featured
            sorted = products;
    }
    
    // Apply current filter
    if (currentFilter === 'new') {
        sorted = sorted.filter(p => p.isNew);
    } else if (currentFilter === 'topseller') {
        sorted = sorted.filter(p => p.isTopSeller);
    }
    
    // Update grid
    const grid = document.getElementById('topbaicProductsGrid');
    if (grid) {
        grid.innerHTML = sorted.map(product => createTopBaicProductCard(product)).join('');
        
        // Re-apply language
        if (typeof switchLanguage === 'function') {
            switchLanguage(currentLanguage || 'en');
        }
    }
}

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('.topbaic-header');
    if (header) {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load products if grid exists
    if (document.getElementById('topbaicProductsGrid')) {
        loadTopBaicProducts();
    }
    
    console.log('✓ TOP BAIC style loaded!');
});

// ============================================
// EXPORT FUNCTIONS
// ============================================
window.TopBaic = {
    createProductCard: createTopBaicProductCard,
    loadProducts: loadTopBaicProducts,
    filterProducts: filterProducts,
    sortProducts: sortProducts,
    addToCart: addToCartTopBaic
};
