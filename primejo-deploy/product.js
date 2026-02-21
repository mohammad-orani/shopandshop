// Get product ID from URL
const urlParams = new URLSearchParams(window.location.search);
const productId = parseInt(urlParams.get('id'));

let selectedQuantity = 1;

// Load product details
function loadProductDetails() {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        document.getElementById('productDetail').innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <h2 data-en="Product not found" data-ar="المنتج غير موجود">Product not found</h2>
                <a href="index.html" class="btn" style="display: inline-block; margin-top: 1rem;" data-en="Back to Home" data-ar="العودة للرئيسية">Back to Home</a>
            </div>
        `;
        switchLanguage(currentLanguage);
        return;
    }
    
    const nameKey = `name_${currentLanguage}`;
    const descKey = `description_${currentLanguage}`;
    const discount = product.oldPrice !== product.newPrice ? Math.round(((product.oldPrice - product.newPrice) / product.oldPrice) * 100) : 0;
    
    // Prepare all images (main + additional)
    const allImages = [product.image];
    if (product.additionalImages && Array.isArray(product.additionalImages)) {
        allImages.push(...product.additionalImages.filter(img => img && img.trim()));
    }
    
    // Generate thumbnail HTML
    const thumbnailsHTML = allImages.map((img, index) => `
        <div class="thumbnail ${index === 0 ? 'active' : ''}">
            <img src="${img}" alt="${product[nameKey]}" onclick="changeMainImage('${img}', this)">
        </div>
    `).join('');
    
    const productHTML = `
        <div class="product-gallery">
            <div class="main-image">
                <img src="${product.image}" alt="${product[nameKey]}" id="mainImage">
            </div>
            <div class="thumbnail-images">
                ${thumbnailsHTML}
            </div>
        </div>
        
        <div class="product-details">
            <h1>${product[nameKey]}</h1>
            
            <!-- Free Delivery Banner -->
            <div class="free-delivery-banner" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 20px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                <svg style="width: 28px; height: 28px; flex-shrink: 0;" fill="white" viewBox="0 0 24 24">
                    <path d="M18 18.5a1.5 1.5 0 0 1-1 1.5 1.5 1.5 0 0 1-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1 1.5M19.5 9.5h-2.54l-1.93-3.86C15.03 5.64 15 5.5 15 5.36c-.03-.14-.12-.27-.22-.38-.1-.11-.23-.19-.37-.22H6c-.42 0-.65.48-.39.81l2.39 3.29H3.5c-.42 0-.65.48-.39.81l5 6.5c.25.33.75.33 1 0l2-2.6V19c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-5l2-2.5c0-.28-.22-.5-.5-.5M8 18.5a1.5 1.5 0 0 1-1 1.5 1.5 1.5 0 0 1-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1 1.5Z"/>
                </svg>
                <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 16px; margin-bottom: 2px;" data-en="🎉 FREE DELIVERY ALWAYS!" data-ar="🎉 توصيل مجاني دائماً!">🎉 FREE DELIVERY ALWAYS!</div>
                    <div style="font-size: 13px; opacity: 0.95;" data-en="Enjoy free shipping on all orders - No minimum purchase required!" data-ar="استمتع بالشحن المجاني على جميع الطلبات - بدون حد أدنى للشراء!">Enjoy free shipping on all orders - No minimum purchase required!</div>
                </div>
            </div>
            
            <div class="product-stock ${(product.quantityToSell || product.stock) > 0 ? '' : 'out-of-stock'}">
                ${(product.quantityToSell || product.stock) > 0 
                    ? `<span data-en="Available: ${product.quantityToSell || product.stock} units" data-ar="متوفر: ${product.quantityToSell || product.stock} وحدة">Available: ${product.quantityToSell || product.stock} units</span>` 
                    : `<span data-en="Out of Stock" data-ar="غير متوفر">Out of Stock</span>`}
            </div>
            
            <div class="product-prices">
                <span class="current-price">${formatPrice(product.newPrice)}</span>
                ${product.oldPrice !== product.newPrice ? `
                    <span class="old-price">${formatPrice(product.oldPrice)}</span>
                    <span class="discount-badge">${discount}% OFF</span>
                ` : ''}
            </div>
            
            <div class="product-description">
                <h3 data-en="Description" data-ar="الوصف">Description</h3>
                <p>${product[descKey]}</p>
            </div>
            
            <div class="quantity-selector">
                <label data-en="Quantity" data-ar="الكمية">Quantity</label>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="decreaseQuantity()">-</button>
                    <input type="number" id="quantityInput" class="quantity-input" value="1" min="1" max="${product.quantityToSell || product.stock}" onchange="updateQuantity()">
                    <button class="quantity-btn" onclick="increaseQuantity()">+</button>
                </div>
            </div>
            
            <button class="add-to-cart-btn" onclick="addProductToCart()" ${(product.quantityToSell || product.stock) === 0 ? 'disabled' : ''}>
                <span data-en="Add to Cart" data-ar="أضف إلى السلة">Add to Cart</span>
            </button>
            
            <div class="action-buttons">
                <button class="secondary-btn" onclick="toggleFavorite(${product.id})">
                    <span data-en="Add to Favorites" data-ar="أضف للمفضلة">Add to Favorites</span>
                </button>
                <button class="secondary-btn" onclick="window.location.href='index.html'">
                    <span data-en="Continue Shopping" data-ar="متابعة التسوق">Continue Shopping</span>
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('productDetail').innerHTML = productHTML;
    switchLanguage(currentLanguage);
}

function changeMainImage(src, thumbnail) {
    document.getElementById('mainImage').src = src;
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    thumbnail.parentElement.classList.add('active');
}

function increaseQuantity() {
    const input = document.getElementById('quantityInput');
    const max = parseInt(input.max);
    if (parseInt(input.value) < max) {
        input.value = parseInt(input.value) + 1;
        selectedQuantity = parseInt(input.value);
    }
}

function decreaseQuantity() {
    const input = document.getElementById('quantityInput');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
        selectedQuantity = parseInt(input.value);
    }
}

function updateQuantity() {
    const input = document.getElementById('quantityInput');
    const value = parseInt(input.value);
    const max = parseInt(input.max);
    
    if (value < 1) {
        input.value = 1;
    } else if (value > max) {
        input.value = max;
    }
    selectedQuantity = parseInt(input.value);
}

function addProductToCart() {
    const cart = getCart();
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += selectedQuantity;
    } else {
        cart.push({ productId, quantity: selectedQuantity });
    }
    
    saveCart(cart);
    
    // Use modern toast notification if available
    if (window.ModernAnimations && window.ModernAnimations.showToast) {
        window.ModernAnimations.showToast(
            currentLanguage === 'en' 
                ? `${selectedQuantity} item(s) added to cart! 🛒` 
                : `تمت إضافة ${selectedQuantity} عنصر إلى السلة! 🛒`,
            'success'
        );
    } else {
        alert(currentLanguage === 'en' 
            ? `${selectedQuantity} item(s) added to cart!` 
            : `تمت إضافة ${selectedQuantity} عنصر إلى السلة!`);
    }
    
    // Reset quantity
    selectedQuantity = 1;
    document.getElementById('quantityInput').value = 1;
}

// Load product on page load
loadProductDetails();
