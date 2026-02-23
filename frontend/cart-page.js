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
console.log('✅ cart-page.js loaded');