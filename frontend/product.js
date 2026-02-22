// ==================== PRODUCT PAGE ====================

let selectedQuantity = 1;
let currentProduct = null;

// ==================== LOAD PRODUCT DETAILS ====================

async function loadProductDetails() {
    try {
        // Get product ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId) {
            window.location.href = 'index.html';
            return;
        }

        console.log('🔍 Loading product:', productId);

        // Get all products from API
        const products = await getProducts();
        console.log('📦 All products:', products);

        // Find the specific product
        const product = products.find(p => String(p.id) === String(productId));

        if (!product) {
            console.error('❌ Product not found:', productId);
            alert('Product not found');
            window.location.href = 'index.html';
            return;
        }

        console.log('✅ Found product:', product);
        currentProduct = product;

        // Display product details
        displayProductDetails(product);

    } catch (error) {
        console.error('❌ Error loading product:', error);
        alert('Error loading product: ' + error.message);
    }
}

// ==================== DISPLAY PRODUCT DETAILS ====================

function displayProductDetails(product) {
    const nameKey = `name_${typeof currentLanguage !== 'undefined' ? currentLanguage : 'en'}`;
    const descKey = `description_${typeof currentLanguage !== 'undefined' ? currentLanguage : 'en'}`;

    // ✅ Parse additional images if it's a string
    let additionalImages = product.additionalImages || [];
    if (typeof additionalImages === 'string') {
        try {
            additionalImages = JSON.parse(additionalImages);
        } catch (e) {
            additionalImages = [];
        }
    }
    if (!Array.isArray(additionalImages)) {
        additionalImages = [];
    }

    const productHTML = `
        <div class="product-images">
            <div class="main-image">
                <img id="mainImage" src="${product.image}" alt="${product[nameKey] || product.name_en}">
                ${additionalImages && additionalImages.length > 0 ? `
                    <div class="image-count-badge">
                        📸 ${additionalImages.length + 1} Photos
                    </div>
                ` : ''}
            </div>
            
            ${(additionalImages && additionalImages.length > 0) || product.image ? `
                <div class="thumbnail-container">
                    <!-- Main Image Thumbnail -->
                    <div class="thumbnail active" onclick="changeMainImage('${product.image}', this)">
                        <img src="${product.image}" alt="${product[nameKey] || product.name_en}">
                    </div>
                    
                    <!-- Additional Images Thumbnails -->
                    ${additionalImages && additionalImages.length > 0 ? additionalImages.map((img, index) => `
                        <div class="thumbnail" onclick="changeMainImage('${img}', this)">
                            <img src="${img}" 
                                 alt="${product[nameKey] || product.name_en} - Image ${index + 2}"
                                 onerror="this.parentElement.style.display='none'">
                        </div>
                    `).join('') : ''}
                </div>
            ` : ''}
        </div>

        <div class="product-info-section">
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                ${product.isOffer ? '<div class="product-badge sale-badge">SALE</div>' : ''}
                ${product.isNew ? '<div class="product-badge new-badge">NEW</div>' : ''}
                ${product.topSeller ? '<div class="product-badge" style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #000;">⭐ TOP SELLER</div>' : ''}
            </div>
            
            <h1 class="product-title">${product[nameKey] || product.name_en}</h1>
            
            <div class="product-price-section">
                <span class="current-price">${formatPrice(product.newPrice)}</span>
                ${product.oldPrice && product.oldPrice !== product.newPrice ?
            `<span class="old-price">${formatPrice(product.oldPrice)}</span>
                     <span class="discount-badge">-${Math.round((1 - product.newPrice / product.oldPrice) * 100)}%</span>`
            : ''}
            </div>

            <div class="product-description">
                <h3 data-en="Product Description" data-ar="وصف المنتج">Product Description</h3>
                <div class="description-content ${(product[descKey] || product.description_en || '').length > 200 ? 'truncated' : ''}" 
                     id="productDescription"
                     style="white-space: pre-wrap; line-height: 1.8;">
                    ${product[descKey] || product.description_en || 'No description available'}
                </div>
                ${(product[descKey] || product.description_en || '').length > 200 ? `
                    <button class="read-more-btn" onclick="toggleDescription()" id="readMoreBtn">
                        <span data-en="Read More ▼" data-ar="اقرأ المزيد ▼">Read More ▼</span>
                    </button>
                ` : ''}
            </div>

            

            ${(product.quantity_to_sell || product.quantityToSell || product.stock || 0) > 0 ? `
                <div class="quantity-selector">
                    <label data-en="Quantity:" data-ar="الكمية:">Quantity:</label>
                    <div class="quantity-controls">
                        <button class="qty-btn" onclick="decreaseQuantity()">-</button>
                        <input type="number" 
                               id="quantityInput" 
                               value="1" 
                               min="1" 
                               max="${product.quantity_to_sell || product.quantityToSell || product.stock}"
                               onchange="updateQuantity()">
                        <button class="qty-btn" onclick="increaseQuantity()">+</button>
                    </div>
                    <span class="stock-info" style="color: #666; font-size: 0.9rem;">
                        ${product.quantity_to_sell || product.quantityToSell || product.stock} available
                    </span>
                </div>

                <button class="add-to-cart-btn" onclick="addProductToCart()">
                    <span data-en="Add to Cart" data-ar="أضف للسلة">Add to Cart</span>
                </button>
            ` : `
                <div class="out-of-stock" style="padding: 1rem; background: #fee; color: #c33; border-radius: 8px; margin: 1rem 0;">
                    <strong data-en="Out of Stock" data-ar="غير متوفر">Out of Stock</strong>
                </div>
            `}

            ${product.videoUrl ? `
                <div class="product-video" style="margin-top: 2rem;">
                    <h3 data-en="Product Video" data-ar="فيديو المنتج">Product Video</h3>
                    ${product.videoUrl.includes('youtube.com') || product.videoUrl.includes('youtu.be') ? `
                        <iframe width="100%" height="315" 
                                src="https://www.youtube.com/embed/${getYouTubeId(product.videoUrl)}" 
                                frameborder="0" allowfullscreen></iframe>
                    ` : `
                        <video width="100%" controls>
                            <source src="${product.videoUrl}">
                            Your browser does not support the video tag.
                        </video>
                    `}
                </div>
            ` : ''}
        </div>
    `;

    document.getElementById('productDetail').innerHTML = productHTML;

    // Re-apply language
    if (typeof switchLanguage === 'function' && typeof currentLanguage !== 'undefined') {
        switchLanguage(currentLanguage);
    }

    console.log('✅ Product displayed successfully');
}

// ==================== HELPER FUNCTIONS ====================

function getYouTubeId(url) {
    if (url.includes('watch?v=')) {
        return url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
        return url.split('youtu.be/')[1]?.split('?')[0];
    }
    return '';
}

function changeMainImage(src, thumbnail) {
    const mainImg = document.getElementById('mainImage');
    if (mainImg) {
        // Add fade animation
        mainImg.style.opacity = '0.5';
        mainImg.src = src;

        // Fade back in after image loads
        mainImg.onload = function () {
            mainImg.style.opacity = '1';
        };
    }

    // Update active state on thumbnails
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    if (thumbnail) {
        thumbnail.classList.add('active');
    }
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
    if (!currentProduct) return;

    addToCart(currentProduct.id, selectedQuantity);

    // Use modern toast notification if available
    if (window.ModernAnimations && window.ModernAnimations.showToast) {
        window.ModernAnimations.showToast(
            (typeof currentLanguage !== 'undefined' && currentLanguage === 'ar')
                ? `تمت إضافة ${selectedQuantity} عنصر إلى السلة! 🛒`
                : `${selectedQuantity} item(s) added to cart! 🛒`,
            'success'
        );
    } else {
        alert((typeof currentLanguage !== 'undefined' && currentLanguage === 'ar')
            ? `تمت إضافة ${selectedQuantity} عنصر إلى السلة!`
            : `${selectedQuantity} item(s) added to cart!`);
    }

    // Reset quantity
    selectedQuantity = 1;
    const qtyInput = document.getElementById('quantityInput');
    if (qtyInput) qtyInput.value = 1;
}

// ==================== TOGGLE DESCRIPTION ====================

function toggleDescription() {
    const descEl = document.getElementById('productDescription');
    const btnEl = document.getElementById('readMoreBtn');

    if (!descEl || !btnEl) return;

    const isExpanded = descEl.classList.contains('expanded');

    if (isExpanded) {
        descEl.classList.remove('expanded');
        descEl.classList.add('truncated');
        btnEl.innerHTML = (typeof currentLanguage !== 'undefined' && currentLanguage === 'ar')
            ? '<span data-en="Read More ▼" data-ar="اقرأ المزيد ▼">اقرأ المزيد ▼</span>'
            : '<span data-en="Read More ▼" data-ar="اقرأ المزيد ▼">Read More ▼</span>';
    } else {
        descEl.classList.remove('truncated');
        descEl.classList.add('expanded');
        btnEl.innerHTML = (typeof currentLanguage !== 'undefined' && currentLanguage === 'ar')
            ? '<span data-en="Read Less ▲" data-ar="اقرأ أقل ▲">اقرأ أقل ▲</span>'
            : '<span data-en="Read Less ▲" data-ar="اقرأ أقل ▲">Read Less ▲</span>';
    }
}

// Make function available globally
window.toggleDescription = toggleDescription;

// ==================== INITIALIZE ====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProductDetails);
} else {
    loadProductDetails();
}

console.log('✅ product.js loaded');