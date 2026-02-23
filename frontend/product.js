// ==================== PRODUCT PAGE ====================

let selectedQuantity = 1;
let currentProduct = null;

// ==================== LOAD PRODUCT DETAILS ====================

async function loadProductDetails() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId) {
            window.location.href = 'index.html';
            return;
        }

        console.log('🔍 Loading product:', productId);

        const products = await getProducts();
        const product = products.find(p => String(p.id) === String(productId));

        if (!product) {
            console.error('❌ Product not found:', productId);
            alert('Product not found');
            window.location.href = 'index.html';
            return;
        }

        console.log('✅ Found product:', product);
        currentProduct = product;
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

    // Parse additional images
    let additionalImages = product.additionalImages || [];
    if (typeof additionalImages === 'string') {
        try { additionalImages = JSON.parse(additionalImages); }
        catch (e) { additionalImages = []; }
    }
    if (!Array.isArray(additionalImages)) additionalImages = [];

    // Get description text — strip HTML tags for length check
    const rawDesc = product[descKey] || product.description_en || '';
    const descText = rawDesc.replace(/<[^>]*>/g, '').trim();

    // Convert newlines → <br> so line breaks show without needing white-space:pre-wrap
    // (pre-wrap breaks Arabic letter joining/shaping)
    const descHTML = descText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r\n|\r|\n/g, '<br>');

    // Only truncate if description is genuinely long (> 300 chars)
    const shouldTruncate = descText.length > 300;
    const descClass = shouldTruncate ? 'truncated' : '';

    const productHTML = `
        <div class="product-images">
            <div class="main-image">
                <img id="mainImage"
                     src="${product.image}"
                     alt="${(product[nameKey] || product.name_en || '').replace(/"/g, '&quot;')}"
                     onerror="this.onerror=null;this.src='https://placehold.co/500x500?text=No+Image'">
                ${additionalImages.length > 0 ? `
                    <div class="image-count-badge">
                        📸 ${additionalImages.length + 1} Photos
                    </div>
                ` : ''}
            </div>

            ${product.image || additionalImages.length > 0 ? `
                <div class="thumbnail-container">
                    <div class="thumbnail active" onclick="changeMainImage('${product.image}', this)">
                        <img src="${product.image}"
                             alt="${(product[nameKey] || product.name_en || '').replace(/"/g, '&quot;')}"
                             onerror="this.onerror=null;this.src='https://placehold.co/100x100?text=No+Image'">
                    </div>
                    ${additionalImages.map((img, index) => `
                        <div class="thumbnail" onclick="changeMainImage('${img}', this)">
                            <img src="${img}"
                                 alt="${(product[nameKey] || product.name_en || '').replace(/"/g, '&quot;')} - ${index + 2}"
                                 onerror="this.parentElement.style.display='none'">
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>

        <div class="product-info-section">
            <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:0.5rem;">
                ${product.isOffer  ? '<div class="product-badge sale-badge">SALE</div>' : ''}
                ${product.isNew    ? '<div class="product-badge new-badge">NEW</div>'  : ''}
                ${product.topSeller ? '<div class="product-badge" style="background:linear-gradient(135deg,#FFD700,#FFA500);color:#000;">⭐ TOP SELLER</div>' : ''}
            </div>

            <h1 class="product-title">${product[nameKey] || product.name_en}</h1>

            <div class="product-price-section">
                <span class="current-price">${formatPrice(product.newPrice)}</span>
                ${product.oldPrice && product.oldPrice !== product.newPrice ? `
                    <span class="old-price">${formatPrice(product.oldPrice)}</span>
                    <span class="discount-badge">-${Math.round((1 - product.newPrice / product.oldPrice) * 100)}%</span>
                ` : ''}
            </div>

            <div class="product-description">
                <h3 data-en="Product Description" data-ar="وصف المنتج">Product Description</h3>
                <!--
                    FIX: Removed inline style="white-space:pre-wrap" — it was breaking
                    Arabic letter joining (shaping). CSS handles this instead.
                    FIX: No truncated class unless text is genuinely long (>300 chars).
                -->
                <div class="description-content ${descClass}" id="productDescription">
                    ${descHTML || (currentLanguage === 'ar' ? 'لا يوجد وصف' : 'No description available')}
                </div>
                ${shouldTruncate ? `
                    <button class="read-more-btn" onclick="toggleDescription()" id="readMoreBtn">
                        <span data-en="Read More ▼" data-ar="اقرأ المزيد ▼">
                            ${currentLanguage === 'ar' ? 'اقرأ المزيد ▼' : 'Read More ▼'}
                        </span>
                    </button>
                ` : ''}
            </div>

            ${(product.quantity_to_sell || product.quantityToSell || 0) > 0 ? `
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
                    <span class="stock-info">
                        ${product.quantity_to_sell || product.quantityToSell || product.stock}
                        <span data-en="available" data-ar="متوفر">available</span>
                    </span>
                </div>

                <button class="add-to-cart-btn" onclick="addProductToCart()">
                    <span data-en="Add to Cart" data-ar="أضف للسلة">Add to Cart</span>
                </button>
            ` : `
                <div class="out-of-stock">
                    <strong data-en="Out of Stock" data-ar="غير متوفر">Out of Stock</strong>
                </div>
            `}

            ${product.videoUrl ? `
                <div class="product-video">
                    <h3 data-en="Product Video" data-ar="فيديو المنتج">Product Video</h3>
                    ${product.videoUrl.includes('youtube.com') || product.videoUrl.includes('youtu.be') ? `
                        <iframe width="100%" height="315"
                                src="https://www.youtube.com/embed/${getYouTubeId(product.videoUrl)}"
                                frameborder="0" allowfullscreen></iframe>
                    ` : `
                        <video width="100%" controls>
                            <source src="${product.videoUrl}">
                        </video>
                    `}
                </div>
            ` : ''}
        </div>
    `;

    document.getElementById('productDetail').innerHTML = productHTML;

    if (typeof switchLanguage === 'function' && typeof currentLanguage !== 'undefined') {
        switchLanguage(currentLanguage);
    }

    console.log('✅ Product displayed successfully');
}

// ==================== HELPER FUNCTIONS ====================

function getYouTubeId(url) {
    if (url.includes('watch?v=')) return url.split('v=')[1]?.split('&')[0];
    if (url.includes('youtu.be/'))  return url.split('youtu.be/')[1]?.split('?')[0];
    return '';
}

function changeMainImage(src, thumbnail) {
    const mainImg = document.getElementById('mainImage');
    if (mainImg) {
        mainImg.style.opacity = '0.5';
        mainImg.src = src;
        mainImg.onload = () => { mainImg.style.opacity = '1'; };
    }
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    if (thumbnail) thumbnail.classList.add('active');
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
    if (value < 1)   input.value = 1;
    if (value > max) input.value = max;
    selectedQuantity = parseInt(input.value);
}

function addProductToCart() {
    if (!currentProduct) return;

    addToCart(currentProduct.id, selectedQuantity);

    const msg = (typeof currentLanguage !== 'undefined' && currentLanguage === 'ar')
        ? `تمت إضافة ${selectedQuantity} عنصر إلى السلة! 🛒`
        : `${selectedQuantity} item(s) added to cart! 🛒`;

    if (window.ModernAnimations?.showToast) {
        window.ModernAnimations.showToast(msg, 'success');
    } else {
        alert(msg);
    }

    selectedQuantity = 1;
    const qtyInput = document.getElementById('quantityInput');
    if (qtyInput) qtyInput.value = 1;
}

// ==================== TOGGLE DESCRIPTION ====================

function toggleDescription() {
    const descEl = document.getElementById('productDescription');
    const btnEl  = document.getElementById('readMoreBtn');
    if (!descEl || !btnEl) return;

    const isExpanded = descEl.classList.contains('expanded');

    if (isExpanded) {
        descEl.classList.remove('expanded');
        descEl.classList.add('truncated');
        btnEl.innerHTML = `<span data-en="Read More ▼" data-ar="اقرأ المزيد ▼">${
            currentLanguage === 'ar' ? 'اقرأ المزيد ▼' : 'Read More ▼'
        }</span>`;
    } else {
        descEl.classList.remove('truncated');
        descEl.classList.add('expanded');
        btnEl.innerHTML = `<span data-en="Read Less ▲" data-ar="اقرأ أقل ▲">${
            currentLanguage === 'ar' ? 'اقرأ أقل ▲' : 'Read Less ▲'
        }</span>`;
    }
}

window.toggleDescription = toggleDescription;

// ==================== INITIALIZE ====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProductDetails);
} else {
    loadProductDetails();
}

console.log('✅ product.js loaded');