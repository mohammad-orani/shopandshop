// ==================== CART PAGE ====================

// Load cart items and display
async function loadCartItems() {
    const cart = getCart();
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCartMessage = document.getElementById('emptyCart');

    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.style.display = 'none';
        if (emptyCartMessage) emptyCartMessage.style.display = 'block';
        updateOrderSummary();
        return;
    }

    try {
        // ✅ AWAIT the async function
        const products = await getProducts();

        if (!Array.isArray(products)) {
            console.error('❌ getProducts() did not return an array:', products);
            return;
        }

        let cartHTML = '';

        cart.forEach(item => {
            const product = products.find(p => String(p.id) === String(item.productId));

            if (!product) {
                console.warn('Product not found:', item.productId);
                return;
            }

            const nameKey = `name_${typeof currentLanguage !== 'undefined' ? currentLanguage : 'en'}`;
            const total = product.newPrice * item.quantity;

            cartHTML += `
                <div class="cart-item" data-product-id="${product.id}">
                    <img src="${product.image}" alt="${product[nameKey]}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h3>${product[nameKey]}</h3>
                        <p class="cart-item-price">${product.newPrice.toFixed(2)} JOD</p>
                    </div>
                    <div class="cart-item-quantity">
                        <button onclick="updateQuantity(${product.id}, ${item.quantity - 1})" class="qty-btn">-</button>
                        <input type="number" value="${item.quantity}" min="1" readonly>
                        <button onclick="updateQuantity(${product.id}, ${item.quantity + 1})" class="qty-btn">+</button>
                         <button onclick="removeItem(${product.id})" class="remove-btn">×</button>
                    </div>
                    
                   
                </div>
            `;
        });

        cartItemsContainer.innerHTML = cartHTML;
        cartItemsContainer.style.display = 'block';
        if (emptyCartMessage) emptyCartMessage.style.display = 'none';

        updateOrderSummary();

    } catch (error) {
        console.error('Error loading cart:', error);
        cartItemsContainer.innerHTML = '<p style="color: red; padding: 2rem;">Error loading cart items</p>';
    }
}

async function updateOrderSummary() {
    const cart = getCart();

    try {
        const products = await getProducts();

        let subtotal = 0;
        cart.forEach(item => {
            const product = products.find(p => String(p.id) === String(item.productId));
            if (product) {
                subtotal += product.newPrice * item.quantity;
            }
        });

        const subtotalEl = document.getElementById('subtotal');
        const totalEl = document.getElementById('total');

        if (subtotalEl) subtotalEl.textContent = `${subtotal.toFixed(2)} JOD`;
        if (totalEl) totalEl.textContent = `${subtotal.toFixed(2)} JOD`;

    } catch (error) {
        console.error('Error updating summary:', error);
    }
}

function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) return;
    updateCartItemQuantity(productId, newQuantity);
    loadCartItems();
}

function removeItem(productId) {
    removeFromCart(productId);
    loadCartItems();
}

function clearCartAndReload() {
    if (confirm('Are you sure you want to clear the cart?')) {
        clearCart();
        loadCartItems();
    }
}

// Initialize cart on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCartItems);
} else {
    loadCartItems();
}
function proceedToCheckout() {
    const cart = getCart();
    if (cart.length === 0) {
        alert(currentLanguage === 'en' ? 'Your cart is empty!' : 'سلتك فارغة!');
        return;
    }
    window.location.href = 'checkout.html';
}


/****Load Top seller products****/
// Load Top seller products into grid — fetches from API
async function loadTopBaicTopSellerProducts() {
    const grid = document.getElementById('topbaicTopSellerProductsGrid');
    if (!grid) return;

    // Skeleton loading
    if (window.ModernAnimations && window.ModernAnimations.showProductSkeleton) {
        window.ModernAnimations.showProductSkeleton(grid, 8);
    } else {
        grid.innerHTML = '<p style="padding:40px;text-align:center;color:#999;">Loading...</p>';
    }

    try {
        const products = await getProducts();

        if (!products.length) {
            grid.innerHTML = '<p style="text-align:center;padding:3rem;color:#999;" data-en="No products available" data-ar="لا توجد منتجات">No products available</p>';
            return;
        }

        grid.innerHTML = products.map(p => createTopBaicProductCard(p)).join('');

        // Product count
        const countEl = document.getElementById('productCount');
        if (countEl) {
            countEl.innerHTML = `<span data-en="Showing ${products.length} products"
                                       data-ar="عرض ${products.length} منتج">
                                    Showing ${products.length} products
                                 </span>`;
        }

        if (typeof switchLanguage === 'function') switchLanguage(currentLanguage || 'en');

        // Scroll reveals
        setTimeout(() => {
            document.querySelectorAll('.scroll-reveal').forEach((el, i) => {
                setTimeout(() => el.classList.add('revealed'), i * 80);
            });
        }, 100);

        console.log('✅ Loaded', products.length, 'products');

    } catch (err) {
        console.error('loadTopBaicTopSellerProducts error:', err);
        grid.innerHTML = '<p style="text-align:center;padding:3rem;color:#e74c3c;">Failed to load products.</p>';
    }
}

// Filter (works on already-loaded cards)
let defaultFilter = 'topseller';

async function filterProducts(filter, clickedBtn) {
    defaultFilter = filter;

    // Use passed button element — global event is unreliable in async functions
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (clickedBtn) clickedBtn.classList.add('active');

    const grid = document.getElementById('topbaicTopSellerProductsGrid');
    if (!grid) return;

    grid.innerHTML = '<p style="padding:40px;text-align:center;color:#999;">Loading...</p>';

    const allProducts = await getProducts();
    let filtered = allProducts;

    // Check both raw API fields (is_top_seller/is_offer) AND mapped fields (topSeller/isOffer)
    if (filter === 'new') filtered = allProducts.filter(p => p.is_offer == 1 || p.isOffer || p.isNew);
    if (filter === 'topseller') filtered = allProducts.filter(p => p.is_top_seller == 1 || p.topSeller || p.isTopSeller);

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align:center;padding:3rem;color:#999;" data-en="No products found" data-ar="لا توجد منتجات">No products found</p>';
        if (typeof switchLanguage === 'function') switchLanguage(currentLanguage || 'en');
        return;
    }

    grid.innerHTML = filtered.map(p => createTopBaicProductCard(p)).join('');
    if (typeof switchLanguage === 'function') switchLanguage(currentLanguage || 'en');
}

// Sort
async function sortProducts(sortBy) {
    const grid = document.getElementById('topbaicTopSellerProductsGrid');
    if (!grid) return;

    const allProducts = await getProducts();
    let sorted = allProducts.map(normalizeProduct);

    if (defaultFilter === 'new') sorted = sorted.filter(p => p.isOffer || p.isNew);
    if (defaultFilter === 'topseller') sorted = sorted.filter(p => p.isTopSeller);

    switch (sortBy) {
        case 'price-low': sorted.sort((a, b) => a.newPrice - b.newPrice); break;
        case 'price-high': sorted.sort((a, b) => b.newPrice - a.newPrice); break;
        case 'name': sorted.sort((a, b) => (a.name_en || '').localeCompare(b.name_en || '')); break;
    }

    grid.innerHTML = sorted.map(p => createTopBaicProductCard(p)).join('');
    if (typeof switchLanguage === 'function') switchLanguage(currentLanguage || 'en');
}

// Navbar scroll effect
window.addEventListener('scroll', function () {
    const header = document.querySelector('.topbaic-header');
    if (header) header.classList.toggle('scrolled', window.scrollY > 50);
});

// Init
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('topbaicTopSellerProductsGrid')) {
        loadTopBaicTopSellerProducts().then(() => {
            const topsellerBtn = document.querySelector('.filter-btn[onclick*="topseller"]');
            if (topsellerBtn) topsellerBtn.click();
        });
    }
    console.log('✓ TOP BAIC style loaded');
});

console.log('✅ cart-page.js loaded');