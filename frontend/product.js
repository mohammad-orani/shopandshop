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
            category_id: raw.category_id || raw.category || null,
            additional_images: raw.additional_images || [],
            additionalImages: raw.additional_images || [],
            video_url: raw.video_url || '',
            videoUrl: raw.video_url || '',
            isOffer: !!(raw.is_offer),
            isNew: !!(raw.is_new),
            topSeller: !!(raw.is_top_seller),
            isFreeDelivery: !!(raw.is_free_delivery),
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

        // No color pre-selected by default
        selectedColor = null;

        // If product has no main image, use the first color that actually has an image
        const colors = product.color_variants;
        if (!product.image && colors && Array.isArray(colors)) {
            const firstWithImage = colors.find(c => (c.image || '').trim());
            if (firstWithImage) product.image = firstWithImage.image.trim();
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

        // Resolve category name for the eyebrow label — reuses the existing
        // GET /api/categories endpoint, already used by header.js/app.js.
        let categoryName = '';
        try {
            if (product.category_id && typeof getCategories === 'function') {
                const categories = await getCategories();
                const match = categories.find(c => String(c.id) === String(product.category_id));
                if (match) {
                    const isAr = typeof currentLanguage !== 'undefined' && currentLanguage === 'ar';
                    categoryName = (isAr ? match.name_ar : match.name_en) || match.name_en || '';
                }
            }
        } catch (e) { console.warn('Category lookup failed:', e); }

        updateProductSEO(product, categoryName);
        displayProductDetails(product, categoryName);

        // Related products — reuses the existing catalog endpoint and the
        // same card renderer used everywhere else on the site.
        loadRelatedProducts(product.category_id, product.id);

    } catch (error) {
        console.error('❌ Error loading product:', error);
        alert('Error loading product: ' + error.message);
    }
}

// ==================== SEO: TITLE, META, CANONICAL, PRODUCT + BREADCRUMB SCHEMA ====================

function updateProductSEO(product, categoryName) {
    const brand = window.BRAND || {};
    const brandName = brand.name || '';
    const siteUrl = brand.siteUrl || '';
    const name = product.name_en || '';
    const description = (product.description_en || '').replace(/<[^>]*>/g, '').trim();
    const shortDescription = description.length > 155 ? description.slice(0, 152) + '...' : description;
    const image = product.image || '';
    const canonicalUrl = `${siteUrl}/product.html?id=${product.id}`;
    const availableQty = product.quantity_to_sell || product.quantityToSell || product.stock || 0;

    document.title = `${name} - ${brandName}`;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && shortDescription) metaDesc.setAttribute('content', shortDescription);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', canonicalUrl);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', `${name} - ${brandName}`);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && shortDescription) ogDesc.setAttribute('content', shortDescription);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', canonicalUrl);
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && image) ogImage.setAttribute('content', image);

    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', `${name} - ${brandName}`);
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc && shortDescription) twDesc.setAttribute('content', shortDescription);
    const twImage = document.querySelector('meta[name="twitter:image"]');
    if (twImage && image) twImage.setAttribute('content', image);

    const productSchema = document.getElementById('productSchema');
    if (productSchema) {
        productSchema.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: name,
            image: image ? [image] : undefined,
            description: description || undefined,
            sku: String(product.id),
            brand: { '@type': 'Brand', name: brandName },
            offers: {
                '@type': 'Offer',
                url: canonicalUrl,
                priceCurrency: 'JOD',
                price: product.newPrice || 0,
                availability: availableQty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
            }
        });
    }

    const breadcrumbSchema = document.getElementById('breadcrumbSchema');
    if (breadcrumbSchema) {
        const items = [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/index.html` }
        ];
        if (categoryName && product.category_id) {
            items.push({ '@type': 'ListItem', position: 2, name: categoryName, item: `${siteUrl}/category.html?cat=${product.category_id}` });
        }
        items.push({ '@type': 'ListItem', position: items.length + 1, name: name, item: canonicalUrl });

        breadcrumbSchema.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: items
        });
    }
}

// ==================== DISPLAY PRODUCT DETAILS ====================

function displayProductDetails(product, categoryName) {
    const nameKey = `name_${typeof currentLanguage !== 'undefined' ? currentLanguage : 'en'}`;
    const descKey = `description_${typeof currentLanguage !== 'undefined' ? currentLanguage : 'en'}`;
    const isAr = typeof currentLanguage !== 'undefined' && currentLanguage === 'ar';

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

    // Availability — same tiering logic used by the product card grid
    // (topbaic-products.js), presented here as a pill instead of a dot.
    const availableQty = product.quantity_to_sell || product.quantityToSell || product.stock || 0;
    let availClass = 'in-stock';
    let availText  = isAr ? 'متوفر' : 'In Stock';
    if (availableQty === 0) {
        availClass = 'out-stock';
        availText  = isAr ? 'غير متوفر' : 'Out of Stock';
    } else if (availableQty < 10) {
        availClass = 'low-stock';
        availText  = isAr ? `${availableQty} فقط متبقي` : `Only ${availableQty} left`;
    }

    // Savings display — same numbers already used for the discount badge
    const hasDiscount = product.oldPrice && product.oldPrice !== product.newPrice;
    const savingsAmount = hasDiscount ? (product.oldPrice - product.newPrice) : 0;

    const isFavorited = typeof isInFavorites === 'function' && isInFavorites(product.id);

    const productHTML = `
        <div class="product-images">
            <div class="main-image" id="mainImageWrap">
                <img id="mainImage"
                     src="${product.image}"
                     alt="${(product[nameKey] || product.name_en || '').replace(/"/g, '&quot;')}"
                     fetchpriority="high"
                     onerror="this.onerror=null;this.src='https://placehold.co/500x500?text=No+Image'">
                ${additionalImages.length > 0 ? `
                    <div class="image-count-badge">
                        📸 ${additionalImages.length + 1} Photos
                    </div>
                    <button class="gallery-nav-btn prev" onclick="navigateGallery(-1)" aria-label="Previous image">‹</button>
                    <button class="gallery-nav-btn next" onclick="navigateGallery(1)" aria-label="Next image">›</button>
                ` : ''}
            </div>
            ${additionalImages.length > 0 ? `<p class="swipe-hint" data-en="Swipe to see more photos" data-ar="مرر لرؤية المزيد من الصور">Swipe to see more photos</p>` : ''}

            ${product.image || additionalImages.length > 0 ? `
                <div class="thumbnail-container">
                    <div class="thumbnail active"
                         role="button"
                         tabindex="0"
                         aria-label="View image 1"
                         onclick="changeMainImage('${product.image}', this)"
                         onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();changeMainImage('${product.image}', this);}">
                        <img src="${product.image}"
                             alt="${(product[nameKey] || product.name_en || '').replace(/"/g, '&quot;')}"
                             onerror="this.onerror=null;this.src='https://placehold.co/100x100?text=No+Image'">
                    </div>
                    ${additionalImages.map((img, index) => `
                        <div class="thumbnail"
                             role="button"
                             tabindex="0"
                             aria-label="View image ${index + 2}"
                             onclick="changeMainImage('${img}', this)"
                             onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();changeMainImage('${img}', this);}">
                            <img src="${img}"
                                 alt="${(product[nameKey] || product.name_en || '').replace(/"/g, '&quot;')} - ${index + 2}"
                                 loading="lazy"
                                 onerror="this.parentElement.style.display='none'">
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>

        <div class="product-info-section">
            ${categoryName ? `<div class="product-eyebrow">${categoryName}</div>` : ''}

            <div class="product-badges-row">
                ${product.isOffer       ? '<div class="product-badge sale-badge">SALE</div>' : ''}
                ${product.isNew        ? '<div class="product-badge new-badge">NEW</div>'  : ''}
                ${product.topSeller    ? '<div class="product-badge topseller-badge">⭐ TOP SELLER</div>' : ''}
                ${product.isFreeDelivery ? '<div class="product-badge free-delivery-badge">🚚 توصيل مجاني</div>' : ''}
            </div>

            <h1 class="product-title">${product[nameKey] || product.name_en}</h1>

            <div class="product-meta-row">
                <span class="product-sku">SKU: #${product.id}</span>
                <span class="availability-pill ${availClass}">${availText}</span>
            </div>

            <div class="product-price-section">
                <span class="current-price">${formatPrice(product.newPrice)}</span>
                ${hasDiscount ? `
                    <span class="old-price">${formatPrice(product.oldPrice)}</span>
                    <span class="discount-badge">-${Math.round((1 - product.newPrice / product.oldPrice) * 100)}%</span>
                    <span class="savings-display" data-en="You save ${formatPrice(savingsAmount)}" data-ar="توفر ${formatPrice(savingsAmount)}">You save ${formatPrice(savingsAmount)}</span>
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
                const defaultLabel = isAr ? 'اختر اللون' : 'Select a color';
                return `
                <div class="color-selector">
                    <div class="color-selector-label">
                        <span data-en="Color:" data-ar="اللون:">Color:</span>
                        <span id="selectedColorLabel" class="selected-color-label">${defaultLabel}</span>
                    </div>
                    <div class="color-options">
                        ${colors.map((c) => {
                            const img = (c.image || '').trim();
                            // c.hex is the product's actual variant color (real data), not a
                            // theme color — kept as-is; only the "no color specified" fallback
                            // below uses a design token instead of a hardcoded gray.
                            const bgStyle = img
                                ? `background-image:url('${img}');background-size:cover;background-position:center;`
                                : (c.hex ? `background:${c.hex};` : 'background:var(--color-background);');
                            const label = c.name_ar || c.name;
                            // Pick white or dark text based on hex brightness
                            let labelStyle = '';
                            if (!img && c.hex) {
                                const h = c.hex.replace('#', '');
                                if (h.length >= 6) {
                                    const brightness = (parseInt(h.slice(0,2),16) * 299 + parseInt(h.slice(2,4),16) * 587 + parseInt(h.slice(4,6),16) * 114) / 1000;
                                    if (brightness < 140) labelStyle = 'color:#fff;';
                                }
                            }
                            return `<button class="color-swatch"
                                        onclick="selectColor('${c.name}', '${c.name_ar || c.name}', '${img}', this)"
                                        title="${c.name}"
                                        aria-label="${c.name}"
                                        style="${bgStyle}">
                                        ${!img ? `<span class="color-swatch-label" style="${labelStyle}">${label}</span>` : ''}
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
                <div class="purchase-actions">
                    <button class="add-to-cart-btn" onclick="addProductToCart()">
                        <span data-en="Add to Cart" data-ar="أضف للسلة">Add to Cart</span>
                    </button>
                    <button class="quick-action-btn favorite-action-btn ${isFavorited ? 'active' : ''}"
                            data-product-id="${product.id}"
                            data-heart-icon="true"
                            onclick="toggleFavorite(${product.id})"
                            title="Add to Favorites"
                            aria-label="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}"
                            aria-pressed="${isFavorited}">${isFavorited ? '❤️' : '🤍'}</button>
                </div>`;
                } else {
                    return `
                <div class="quantity-selector">
                    <label for="quantityInput" data-en="Quantity:" data-ar="الكمية:">Quantity:</label>
                    <div class="quantity-controls">
                        <button class="qty-btn" onclick="decreaseQuantity()" aria-label="Decrease quantity">-</button>
                        <input type="number"
                               id="quantityInput"
                               value="1"
                               min="1"
                               max="${product.quantity_to_sell || product.quantityToSell || product.stock}"
                               onchange="ProductPage.updateQuantity()">
                        <button class="qty-btn" onclick="increaseQuantity()" aria-label="Increase quantity">+</button>
                    </div>
                    <span class="stock-info">
                        ${product.quantity_to_sell || product.quantityToSell || product.stock}
                        <span data-en="available" data-ar="متوفر">available</span>
                    </span>
                </div>
                <div class="purchase-actions">
                    <button class="add-to-cart-btn" onclick="addProductToCart()">
                        <span data-en="Add to Cart" data-ar="أضف للسلة">Add to Cart</span>
                    </button>
                    <button class="quick-action-btn favorite-action-btn ${isFavorited ? 'active' : ''}"
                            data-product-id="${product.id}"
                            data-heart-icon="true"
                            onclick="toggleFavorite(${product.id})"
                            title="Add to Favorites"
                            aria-label="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}"
                            aria-pressed="${isFavorited}">${isFavorited ? '❤️' : '🤍'}</button>
                </div>`;
                }
            })() : `
                <div class="out-of-stock">
                    <strong data-en="Out of Stock" data-ar="غير متوفر">Out of Stock</strong>
                </div>
                <div class="purchase-actions">
                    <button class="quick-action-btn favorite-action-btn ${isFavorited ? 'active' : ''}"
                            data-product-id="${product.id}"
                            data-heart-icon="true"
                            onclick="toggleFavorite(${product.id})"
                            title="Add to Favorites"
                            aria-label="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}"
                            aria-pressed="${isFavorited}">${isFavorited ? '❤️' : '🤍'}
                        <span style="margin-inline-start:0.5rem;font-size:0.9rem;" data-en="Save for later" data-ar="احفظ لوقت لاحق">Save for later</span>
                    </button>
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

        <!-- ==================== 6. PRODUCT FEATURES / DETAILS ==================== -->
        <!-- Built only from fields the API actually returns — no fabricated specs. -->
        <div class="product-features-section">
            <h2 class="section-title" data-en="Product Details" data-ar="تفاصيل المنتج">Product Details</h2>
            <div class="features-grid">
                ${categoryName ? `
                    <div class="feature-item">
                        <span class="feature-item__icon" aria-hidden="true">📁</span>
                        <span>
                            <span class="feature-item__label" data-en="Category" data-ar="الفئة">Category</span>
                            <span class="feature-item__value">${categoryName}</span>
                        </span>
                    </div>
                ` : ''}
                <div class="feature-item">
                    <span class="feature-item__icon" aria-hidden="true">🏷️</span>
                    <span>
                        <span class="feature-item__label" data-en="SKU" data-ar="رمز المنتج">SKU</span>
                        <span class="feature-item__value">#${product.id}</span>
                    </span>
                </div>
                <div class="feature-item">
                    <span class="feature-item__icon" aria-hidden="true">📦</span>
                    <span>
                        <span class="feature-item__label" data-en="Availability" data-ar="التوفر">Availability</span>
                        <span class="feature-item__value">${availText}</span>
                    </span>
                </div>
                <div class="feature-item">
                    <span class="feature-item__icon" aria-hidden="true">🚚</span>
                    <span>
                        <span class="feature-item__label" data-en="Delivery" data-ar="التوصيل">Delivery</span>
                        <span class="feature-item__value">${product.isFreeDelivery
                            ? (isAr ? 'توصيل مجاني' : 'Free Delivery')
                            : (isAr ? 'توصيل قياسي' : 'Standard Delivery')}</span>
                    </span>
                </div>
            </div>
        </div>

        <!-- ==================== 5. TRUST SECTION ==================== -->
        <div class="trust-section">
            <div class="trust-section-grid">
                <div class="trust-section-item">
                    <span class="trust-section-item__icon" aria-hidden="true">🔒</span>
                    <span>
                        <span class="trust-section-item__title" data-en="Secure Payment" data-ar="دفع آمن">Secure Payment</span><br>
                        <span class="trust-section-item__sub" data-en="Your data is protected" data-ar="بياناتك محمية">Your data is protected</span>
                    </span>
                </div>
                <div class="trust-section-item">
                    <span class="trust-section-item__icon" aria-hidden="true">🚚</span>
                    <span>
                        <span class="trust-section-item__title" data-en="Fast Gulf Delivery" data-ar="توصيل سريع للخليج">Fast Gulf Delivery</span><br>
                        <span class="trust-section-item__sub" data-en="Across the GCC" data-ar="لجميع دول الخليج">Across the GCC</span>
                    </span>
                </div>
                <div class="trust-section-item">
                    <span class="trust-section-item__icon" aria-hidden="true">🔄</span>
                    <span>
                        <span class="trust-section-item__title" data-en="Easy Returns" data-ar="إرجاع سهل">Easy Returns</span><br>
                        <span class="trust-section-item__sub" data-en="Hassle-free process" data-ar="عملية بسيطة">Hassle-free process</span>
                    </span>
                </div>
                <div class="trust-section-item">
                    <span class="trust-section-item__icon" aria-hidden="true">💬</span>
                    <span>
                        <span class="trust-section-item__title" data-en="Customer Support" data-ar="دعم العملاء">Customer Support</span><br>
                        <span class="trust-section-item__sub" data-en="Here to help" data-ar="نحن هنا لمساعدتك">Here to help</span>
                    </span>
                </div>
            </div>
        </div>

        <!-- ==================== 7. RELATED PRODUCTS ==================== -->
        <!-- Populated by loadRelatedProducts() below — reuses the existing
             GET /api/products endpoint and createTopBaicProductCard renderer. -->
        <div class="related-products-section" id="relatedProductsSection">
            <h2 class="section-title" data-en="You May Also Like" data-ar="قد يعجبك أيضاً">You May Also Like</h2>
            <div class="products-grid" id="relatedProductsGrid"></div>
        </div>
    `;

    document.getElementById('productDetail').innerHTML = productHTML;

    initGallerySwipe();

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

// ==================== GALLERY NAVIGATION (arrows + swipe) ====================
// Both reuse changeMainImage() above — neither adds a second, competing
// image-switching code path.

function navigateGallery(direction) {
    const thumbs = Array.from(document.querySelectorAll('.thumbnail'));
    if (thumbs.length < 2) return;

    let index = thumbs.findIndex(t => t.classList.contains('active'));
    if (index === -1) index = 0;

    let nextIndex = index + direction;
    if (nextIndex >= thumbs.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = thumbs.length - 1;

    const nextThumb = thumbs[nextIndex];
    const img = nextThumb.querySelector('img');
    if (img) changeMainImage(img.src, nextThumb);
}
window.navigateGallery = navigateGallery;

// Touch swipe support for the main image — additive only, does not touch
// click/onclick behavior used by desktop thumbnails or arrow buttons.
function initGallerySwipe() {
    const wrap = document.getElementById('mainImageWrap');
    if (!wrap) return;

    let startX = 0;
    let startY = 0;

    wrap.addEventListener('touchstart', (e) => {
        if (!e.touches || !e.touches.length) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });

    wrap.addEventListener('touchend', (e) => {
        if (!e.changedTouches || !e.changedTouches.length) return;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;

        // Ignore mostly-vertical gestures so page scrolling still works
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;

        // RTL-aware: in an RTL layout "swipe left" should move to the next
        // image the same way "swipe right" does in LTR.
        const isRtl = document.body.dir === 'rtl' || document.documentElement.dir === 'rtl';
        const direction = dx < 0 ? 1 : -1;
        navigateGallery(isRtl ? -direction : direction);
    }, { passive: true });
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

// Namespaced under window.ProductPage (see below) — this used to be a bare
// global function named updateQuantity, same name as an unrelated function
// in cart-page.js. They never actually collided at runtime (product.js and
// cart-page.js are never both loaded on the same page), but the shared name
// was fragile, so it's namespaced along with the other two collisions.
function productPageUpdateQuantity() {
    const input = document.getElementById('quantityInput');
    const value = parseInt(input.value);
    const max = parseInt(input.max);
    if (value < 1)   input.value = 1;
    if (value > max) input.value = max;
    selectedQuantity = parseInt(input.value);
}

window.ProductPage = {
    updateQuantity: productPageUpdateQuantity
};

function selectColor(name, nameAr, image, btn) {
    selectedColor = name;
    const isAr = typeof currentLanguage !== 'undefined' && currentLanguage === 'ar';

    // Update label
    const label = document.getElementById('selectedColorLabel');
    if (label) {
        label.textContent = isAr ? nameAr : name;
        label.style.color = 'var(--color-text)';
    }

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

// ==================== RELATED PRODUCTS ====================
// Reuses the existing GET /api/products endpoint (via the shared getProducts()
// helper in api.js, already cached there) and the same card renderer used by
// the homepage/category grids — no new API, no new card markup.
async function loadRelatedProducts(categoryId, excludeId) {
    const grid = document.getElementById('relatedProductsGrid');
    const section = document.getElementById('relatedProductsSection');
    if (!grid) return;

    try {
        const products = await getProducts();
        const cardFn = typeof createTopBaicProductCard === 'function' ? createTopBaicProductCard : null;
        if (!cardFn) { if (section) section.style.display = 'none'; return; }

        let related = categoryId
            ? products.filter(p => String(p.category) === String(categoryId) && String(p.id) !== String(excludeId))
            : [];

        // Fall back to other visible products if this category has nothing else
        if (related.length === 0) {
            related = products.filter(p => String(p.id) !== String(excludeId) && p.visible !== false);
        }

        related = related.slice(0, 4);

        if (related.length === 0) {
            if (section) section.style.display = 'none';
            return;
        }

        grid.innerHTML = related.map(cardFn).join('');
        if (typeof switchLanguage === 'function') switchLanguage(currentLanguage || 'en');
    } catch (err) {
        console.error('loadRelatedProducts error:', err);
        if (section) section.style.display = 'none';
    }
}

// ==================== INITIALIZE ====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProductDetails);
} else {
    loadProductDetails();
}

console.log('✅ product.js loaded');