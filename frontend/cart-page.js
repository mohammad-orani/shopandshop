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
        // Fetch only the products that are actually in the cart
        const productIds = cart.map(item => item.productId);
        const fetched = await Promise.all(productIds.map(id => getProductByIdFromAPI(id)));
        const products = fetched.filter(Boolean).map(raw => ({
            id: raw.id,
            name_en: raw.name_en,
            name_ar: raw.name_ar,
            newPrice: parseFloat(raw.new_price || raw.newPrice || 0),
            image: raw.image_url || raw.image
        }));

        if (!Array.isArray(products)) {
            console.error('❌ products fetch failed');
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
            const isTier = item.tierPrice !== undefined && item.tierPrice !== null;
            const priceLabel = isTier
                ? `${item.quantity} pcs — ${item.tierPrice.toFixed(2)} JOD`
                : `${product.newPrice.toFixed(2)} JOD each`;
            const lineTotal = isTier ? item.tierPrice : product.newPrice * item.quantity;
            const isAr = typeof currentLanguage !== 'undefined' && currentLanguage === 'ar';

            cartHTML += `
                <div class="cart-item" data-product-id="${product.id}">
                    <div class="cart-item-image-wrap">
                        <img src="${product.image}" alt="${product[nameKey]}" class="cart-item-image" loading="lazy">
                    </div>
                    <div class="cart-item-details">
                        <h3>${product[nameKey]}</h3>
                        <p class="cart-item-price">${priceLabel}</p>
                        <p class="cart-item-line-total">${lineTotal.toFixed(2)} JOD</p>
                        ${isTier ? `<span class="tier-tag">Bundle Deal</span>` : ''}
                    </div>
                    <div class="cart-item-actions">
                        <div class="cart-item-quantity">
                            ${isTier ? `
                                <span class="tier-qty-badge">${item.quantity} pcs</span>
                            ` : `
                                <button onclick="CartPage.updateQuantity(${product.id}, ${item.quantity - 1})" class="qty-btn">-</button>
                                <input type="number" value="${item.quantity}" min="1" readonly>
                                <button onclick="CartPage.updateQuantity(${product.id}, ${item.quantity + 1})" class="qty-btn">+</button>
                            `}
                        </div>
                        <button onclick="removeItem(${product.id})" class="remove-btn" title="${isAr ? 'إزالة' : 'Remove'}">
                            <span aria-hidden="true">🗑</span>
                            <span class="remove-btn-label">${isAr ? 'إزالة' : 'Remove'}</span>
                        </button>
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
        cartItemsContainer.innerHTML = '<p style="color: var(--color-error); padding: 2rem;">Error loading cart items</p>';
    }
}

async function updateOrderSummary() {
    const cart = getCart();

    try {
        const productIds = cart.map(item => item.productId);
        const fetched = await Promise.all(productIds.map(id => getProductByIdFromAPI(id)));
        const products = fetched.filter(Boolean).map(raw => ({
            id:       raw.id,
            newPrice: parseFloat(raw.new_price  || raw.newPrice  || 0),
            oldPrice: parseFloat(raw.old_price  || raw.oldPrice  || 0)
        }));

        let subtotal = 0;
        let savings  = 0;
        cart.forEach(item => {
            const product = products.find(p => String(p.id) === String(item.productId));
            if (!product) return;
            const isTier = item.tierPrice !== undefined && item.tierPrice !== null;
            subtotal += isTier ? item.tierPrice : product.newPrice * item.quantity;
            if (!isTier && product.oldPrice > product.newPrice) {
                savings += (product.oldPrice - product.newPrice) * item.quantity;
            }
            if (isTier && product.oldPrice > 0) {
                savings += Math.max(0, product.oldPrice * item.quantity - item.tierPrice);
            }
        });

        const subtotalEl  = document.getElementById('subtotal');
        const totalEl     = document.getElementById('total');
        const savedRowEl  = document.getElementById('cartSavedRow');

        if (subtotalEl) subtotalEl.textContent = `${subtotal.toFixed(2)} JOD`;
        if (totalEl)    totalEl.textContent    = `${subtotal.toFixed(2)} JOD`;

        // Savings row
        if (savedRowEl) {
            if (savings > 0) {
                savedRowEl.querySelector('.savings-amount').textContent = `${savings.toFixed(2)} JOD`;
                savedRowEl.style.display = '';
            } else {
                savedRowEl.style.display = 'none';
            }
        }

        // Free shipping banner
        const info     = await getGeneralInfoFromAPI();
        const minOrder = parseFloat(info.minimum_order_amount) || 25;
        const bannerEl = document.getElementById('freeShippingBanner');
        if (bannerEl) {
            if (cart.length === 0) {
                bannerEl.style.display = 'none';
            } else if (subtotal >= minOrder) {
                bannerEl.innerHTML    = `<div class="free-shipping-achieved">🎉 <span data-en="You've unlocked free delivery!" data-ar="لقد حصلت على توصيل مجاني!">You've unlocked free delivery!</span></div>`;
                bannerEl.style.display = '';
            } else {
                const remaining = (minOrder - subtotal).toFixed(2);
                const pct       = Math.min((subtotal / minOrder) * 100, 100).toFixed(1);
                bannerEl.innerHTML = `
                    <div class="free-shipping-bar">
                        <p class="free-shipping-msg">
                            <span data-en="Add ${remaining} JOD more for free delivery" data-ar="أضف ${remaining} دينار للحصول على توصيل مجاني">Add ${remaining} JOD more for free delivery</span>
                        </p>
                        <div class="free-shipping-track"><div class="free-shipping-fill" style="width:${pct}%"></div></div>
                    </div>`;
                bannerEl.style.display = '';
            }
            if (typeof switchLanguage === 'function') switchLanguage(currentLanguage || 'en');
        }

    } catch (error) {
        console.error('Error updating summary:', error);
    }
}

function cartPageUpdateQuantity(productId, newQuantity) {
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
        grid.innerHTML = '<p style="padding:40px;text-align:center;color:var(--color-text-light);">Loading...</p>';
    }

    try {
        const products = await getProducts();

        if (!products.length) {
            grid.innerHTML = '<p style="text-align:center;padding:3rem;color:var(--color-text-light);" data-en="No products available" data-ar="لا توجد منتجات">No products available</p>';
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
        grid.innerHTML = '<p style="text-align:center;padding:3rem;color:var(--color-error);">Failed to load products.</p>';
    }
}

// Filter (works on already-loaded cards)
// Namespaced under window.CartPage (see bottom of file) — this file,
// topbaic-products.js, and app.js each used to declare their own same-named
// filterProducts/sortProducts globally, silently overwriting each other
// depending on <script> tag order.
let defaultFilter = 'topseller';

async function cartPageFilterProducts(filter, clickedBtn) {
    defaultFilter = filter;

    // Use passed button element — global event is unreliable in async functions
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (clickedBtn) clickedBtn.classList.add('active');

    const grid = document.getElementById('topbaicTopSellerProductsGrid');
    if (!grid) return;

    grid.innerHTML = '<p style="padding:40px;text-align:center;color:var(--color-text-light);">Loading...</p>';

    const allProducts = await getProducts();
    let filtered = allProducts;

    // Check both raw API fields (is_top_seller/is_offer) AND mapped fields (topSeller/isOffer)
    if (filter === 'new') filtered = allProducts.filter(p => p.is_offer == 1 || p.isOffer || p.isNew);
    if (filter === 'topseller') filtered = allProducts.filter(p => p.is_top_seller == 1 || p.topSeller || p.isTopSeller);

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align:center;padding:3rem;color:var(--color-text-light);" data-en="No products found" data-ar="لا توجد منتجات">No products found</p>';
        if (typeof switchLanguage === 'function') switchLanguage(currentLanguage || 'en');
        return;
    }

    grid.innerHTML = filtered.map(p => createTopBaicProductCard(p)).join('');
    if (typeof switchLanguage === 'function') switchLanguage(currentLanguage || 'en');
}

// Sort
async function cartPageSortProducts(sortBy) {
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

window.CartPage = {
    updateQuantity: cartPageUpdateQuantity,
    filterProducts: cartPageFilterProducts,
    sortProducts: cartPageSortProducts
};

console.log('✅ cart-page.js loaded');