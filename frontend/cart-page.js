function loadCartItems() {
    // Ensure currency is initialized
    if (typeof formatPrice !== 'function') {
        console.error('Currency functions not loaded yet');
        setTimeout(loadCartItems, 100);
        return;
    }
    
    const cart = getCart();
    const products = getProducts();
    const cartItemsContainer = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <h2 data-en="Your cart is empty" data-ar="سلتك فارغة">Your cart is empty</h2>
                <p data-en="Add some items to get started" data-ar="أضف بعض المنتجات للبدء">Add some items to get started</p>
                <a href="index.html" class="empty-cart-btn" data-en="Start Shopping" data-ar="ابدأ التسوق">Start Shopping</a>
            </div>
        `;
        updateCartSummary(0);
        switchLanguage(currentLanguage);
        return;
    }
    
    let cartHTML = '';
    let subtotal = 0;
    
    cart.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return;
        
        const nameKey = `name_${currentLanguage}`;
        const itemTotal = product.newPrice * item.quantity;
        subtotal += itemTotal;
        
        cartHTML += `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${product.image}" alt="${product[nameKey]}">
                </div>
                <div class="cart-item-details">
                    <h3>${product[nameKey]}</h3>
                    <div class="cart-item-price">${formatPrice(product.newPrice)}</div>
                    <div class="cart-item-controls">
                        <div class="quantity-control">
                            <button class="qty-btn" onclick="updateItemQuantity(${product.id}, ${item.quantity - 1})">-</button>
                            <span class="qty-display">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateItemQuantity(${product.id}, ${item.quantity + 1})">+</button>
                        </div>
                        <button class="remove-btn" onclick="removeFromCart(${product.id})" data-en="Remove" data-ar="إزالة">Remove</button>
                    </div>
                </div>
                <div class="cart-item-actions">
                    <div class="item-total">${formatPrice(itemTotal)}</div>
                </div>
            </div>
        `;
    });
    
    cartItemsContainer.innerHTML = cartHTML;
    updateCartSummary(subtotal);
    switchLanguage(currentLanguage);
}

function updateItemQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    const cart = getCart();
    const item = cart.find(item => item.productId === productId);
    if (item) {
        item.quantity = newQuantity;
        saveCart(cart);
        loadCartItems();
    }
}

function removeFromCart(productId) {
    const cart = getCart();
    const updatedCart = cart.filter(item => item.productId !== productId);
    saveCart(updatedCart);
    loadCartItems();
}

function updateCartSummary(subtotal) {
    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('total').textContent = formatPrice(subtotal);
}

function proceedToCheckout() {
    const cart = getCart();
    if (cart.length === 0) {
        alert(currentLanguage === 'en' ? 'Your cart is empty!' : 'سلتك فارغة!');
        return;
    }
    window.location.href = 'checkout.html';
}

// Load cart items on page load
loadCartItems();
