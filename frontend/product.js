// ==================== PRODUCT PAGE ====================

let selectedQuantity = 1;
let selectedTierPrice = null;
let selectedColor = null;
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

        // Fetch single product by ID — avoids loading the entire catalog
        const raw = await getProductByIdFromAPI(productId);

        if (!raw) {
            console.error('❌ Product not found:', productId);
            alert('Product not found');
            window.location.href = 'index.html';
            return;
        }

        // Normalize fields to match the shape expected by displayProductDetails
        const product = {
            id: raw.id,
            name_en: raw.name_en,
            name_ar: raw.name_ar,
            description_en: raw.description_en,
            description_ar: raw.description_ar,
            newPrice: parseFloat(raw.new_price || raw.newPrice || 0),
            oldPrice: parseFloat(raw.old_price || raw.oldPrice || 0),
            image: raw.image_url || raw.image,
            stock: raw.stock || 0,
            quantity_to_sell: raw.quantity_to_sell || 0,
            quantityToSell: raw.quantity_to_sell || 0,
            additional_images: raw.additional_images || [],
            additionalImages: raw.additional_images || [],
            video_url: raw.video_url || '',
            videoUrl: raw.video_url || '',
            isOffer: !!(raw.is_offer),
            isNew: !!(raw.is_new),
            topSeller: !!(raw.is_top_seller),
            quantity_tiers: (() => {
                try {
                    const t = raw.quantity_tiers;
                    if (!t) return null;
                    return typeof t === 'string' ? JSON.parse(t) : t;
                } catch (e) { return null; }
            })(),
            color_variants: (() => {
                try {
                    const c = raw.color_variants;
                    if (!c) return null;
                    return typeof c === 'string' ? JSON.parse(c) : c;
                } catch (e) { return null; }
            })()
        };

        console.log('✅ Found product:', product);
        currentProduct = product;

        // Pre-select first color if product has color variants
        const colors = product.color_variants;
        if (colors && Array.isArray(colors) && colors.length > 0) {
            selectedColor = colors[0].name;
            // Use first color's image as the main displayed image
            if (colors[0].image) product.image = colors[0].image;
        } else {
            selectedColor = null;
        }

        // Pre-select first tier if product has tiers
        const tiers = product.quantity_tiers;
        if (tiers && Array.isArray(tiers) && tiers.length > 0) {
            const sorted = [...tiers].sort((a, b) => a.qty - b.qty);
            selectedQuantity = sorted[0].qty;
            selectedTierPrice = sorted[0].price;
        } else {
            selectedQuantity = 1;
            selectedTierPrice = null;
        }

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

            <div class="product-trust-badges">
                <div class="trust-badge">
                    <span class="trust-stars">★★★★★</span>
                    <span data-en="Trusted by customers" data-ar="موثوق من العملاء">Trusted by customers</span>
                </div>
                <div class="trust-badge">
                    <span class="trust-icon">🚚</span>
                    <span data-en="Free delivery available" data-ar="توصيل مجاني متاح">Free delivery available</span>
                </div>
                <div class="trust-badge">
                    <span class="trust-icon">✅</span>
                    <span data-en="Secure checkout" data-ar="دفع آمن">Secure checkout</span>
                </div>
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

            ${(() => {
                const colors = product.color_variants;
                if (!colors || !Array.isArray(colors) || !colors.length) return '';
                const isAr = typeof currentLanguage !== 'undefined' && currentLanguage === 'ar';
                const firstLabel = isAr ? (colors[0].name_ar || colors[0].name) : colors[0].name;
                return `
                <div class="color-selector">
                    <div class="color-selector-label">
                        <span data-en="Color:" data-ar="اللون:">Color:</span>
                        <span id="selectedColorLabel" style="font-weight:700;margin-inline-start:0.4rem;">${firstLabel}</span>
                    </div>
                    <div class="color-options">
                        ${colors.map((c, i) => {
                            const imgAttr  = c.image ? `data-img="${c.image}"` : '';
                            const bgStyle  = c.image
                                ? `background-image:url('${c.image}');background-size:cover;background-position:center;`
                                : (c.hex ? `background:${c.hex};` : 'background:#eee;');
                            return `<button class="color-swatch${i === 0 ? ' active' : ''}"
                                        onclick="selectColor('${c.name}', '${c.name_ar || c.name}', '${c.image || ''}', this)"
                                        title="${c.name}"
                                        ${imgAttr}
                                        style="${bgStyle}">
                                        ${(!c.image && !c.hex) ? `<span class="color-swatch-label">${c.name}</span>` : ''}
                                    </button>`;
                        }).join('')}
                    </div>
                </div>`;
            })()}

            ${(product.quantity_to_sell || product.quantityToSell || 0) > 0 ? (() => {
                const tiers = product.quantity_tiers;
                if (tiers && Array.isArray(tiers) && tiers.length > 0) {
                    // Sort tiers by qty ascending
                    const sorted = [...tiers].sort((a, b) => a.qty - b.qty);
                    return `
                <div class="tier-selector">
                    <label data-en="Choose your bundle:" data-ar="اختر الكمية:">Choose your bundle:</label>
                    <div class="tier-options">
                        ${sorted.map((tier, i) => `
                            <button class="tier-btn${i === 0 ? ' active' : ''}"
                                    onclick="selectTier(${tier.qty}, ${tier.price}, this)"
                                    data-qty="${tier.qty}" data-price="${tier.price}">
                                <span class="tier-qty" data-en="${tier.qty} pcs" data-ar="${tier.qty} قطع">${tier.qty} pcs</span>
                                <span class="tier-price">${tier.price} JOD</span>
                                ${i > 0 ? `<span class="tier-save" data-en="Save ${(sorted[0].price / sorted[0].qty * tier.qty - tier.price).toFixed(2)} JOD" data-ar="وفر ${(sorted[0].price / sorted[0].qty * tier.qty - tier.price).toFixed(2)} JOD">Save ${(sorted[0].price / sorted[0].qty * tier.qty - tier.price).toFixed(2)} JOD</span>` : ''}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <button class="add-to-cart-btn" onclick="addProductToCart()">
                    <span data-en="Add to Cart" data-ar="أضف للسلة">Add to Cart</span>
                </button>`;
                } else {
                    return `
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
                </button>`;
                }
            })() : `
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

function selectColor(name, nameAr, image, btn) {
    selectedColor = name;
    const isAr = typeof currentLanguage !== 'undefined' && currentLanguage === 'ar';

    // Update label
    const label = document.getElementById('selectedColorLabel');
    if (label) label.textContent = isAr ? nameAr : name;

    // Swap main product image if this color has one
    if (image) {
        const mainImg = document.getElementById('mainImage');
        if (mainImg) {
            mainImg.style.opacity = '0.5';
            mainImg.src = image;
            mainImg.onload = () => { mainImg.style.opacity = '1'; };
        }
        // Highlight matching thumbnail if it exists, else deactivate all thumbnails
        let matched = false;
        document.querySelectorAll('.thumbnail').forEach(t => {
            const tImg = t.querySelector('img');
            if (tImg && tImg.src && tImg.src.includes(image.split('/').pop())) {
                t.classList.add('active');
                matched = true;
            } else {
                t.classList.remove('active');
            }
        });
    }

    // Highlight active swatch
    document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

function selectTier(qty, price, btn) {
    selectedQuantity = qty;
    selectedTierPrice = price;
    document.querySelectorAll('.tier-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

function addProductToCart() {
    if (!currentProduct) return;

    // Require color selection if product has variants
    const colors = currentProduct.color_variants;
    if (colors && Array.isArray(colors) && colors.length > 0 && !selectedColor) {
        const isAr = typeof currentLanguage !== 'undefined' && currentLanguage === 'ar';
        alert(isAr ? 'يرجى اختيار اللون أولاً' : 'Please select a color first');
        return;
    }

    addToCart(currentProduct.id, selectedQuantity, selectedTierPrice, selectedColor);

    const isAr = typeof currentLanguage !== 'undefined' && currentLanguage === 'ar';
    const colorSuffix = selectedColor ? (isAr ? ` — ${selectedColor}` : ` — ${selectedColor}`) : '';
    const msg = selectedTierPrice !== null
        ? (isAr
            ? `تمت إضافة ${selectedQuantity} قطعة بسعر ${selectedTierPrice} JOD إلى السلة!${colorSuffix} 🛒`
            : `${selectedQuantity} pcs for ${selectedTierPrice} JOD added to cart!${colorSuffix} 🛒`)
        : (isAr
            ? `تمت إضافة ${selectedQuantity} عنصر إلى السلة!${colorSuffix} 🛒`
            : `${selectedQuantity} item(s) added to cart!${colorSuffix} 🛒`);

    if (window.ModernAnimations?.showToast) {
        window.ModernAnimations.showToast(msg, 'success');
    } else {
        alert(msg);
    }

    // Reset to first tier if tiers exist, otherwise reset qty to 1
    const tiers = currentProduct.quantity_tiers;
    if (tiers && Array.isArray(tiers) && tiers.length > 0) {
        const sorted = [...tiers].sort((a, b) => a.qty - b.qty);
        selectedQuantity = sorted[0].qty;
        selectedTierPrice = sorted[0].price;
        document.querySelectorAll('.tier-btn').forEach((b, i) => {
            b.classList.toggle('active', i === 0);
        });
    } else {
        selectedQuantity = 1;
        selectedTierPrice = null;
        const qtyInput = document.getElementById('quantityInput');
        if (qtyInput) qtyInput.value = 1;
    }
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