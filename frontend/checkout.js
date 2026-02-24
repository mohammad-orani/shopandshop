// ==================== CHECKOUT.JS - DELIVERY & ORDER PROCESSING ====================

let selectedDeliveryFee = 0;
let selectedActualFee = 0;
let minimumOrderAmount = 15; // default, overridden by DB

// ==================== FREE DELIVERY POPUP ====================

function showFreeDeliveryPopup(cartTotal, minAmount) {
    // Remove existing popup if any
    const existing = document.getElementById('freeDeliveryPopup');
    if (existing) existing.remove();

    const remaining = minAmount - cartTotal;
    const percent = Math.min(100, Math.round((cartTotal / minAmount) * 100));
    const isFree = cartTotal >= minAmount;
    const isAr = (typeof currentLanguage !== 'undefined' && currentLanguage === 'ar');

    const popup = document.createElement('div');
    popup.id = 'freeDeliveryPopup';
    popup.innerHTML = `
        <div class="fdp-inner">
            <button class="fdp-close" onclick="closeFreeDeliveryPopup()">✕</button>
            <div class="fdp-icon">${isFree ? '🎉' : '🚚'}</div>
            ${isFree ? `
                <div class="fdp-title fdp-success">
                    ${isAr ? 'تهانينا! التوصيل مجاني' : 'Congrats! Free Delivery Unlocked'}
                </div>
                <div class="fdp-sub">
                    ${isAr ? 'طلبك يستحق توصيلاً مجانياً ✓' : 'Your order qualifies for free delivery ✓'}
                </div>
            ` : `
                <div class="fdp-title">
                    ${isAr
                        ? `أضف <strong>${formatPrice(remaining)}</strong> للتوصيل المجاني`
                        : `Add <strong>${formatPrice(remaining)}</strong> for free delivery`}
                </div>
                <div class="fdp-sub">
                    ${isAr
                        ? `الحد الأدنى للتوصيل المجاني: ${formatPrice(minAmount)}`
                        : `Free delivery on orders over ${formatPrice(minAmount)}`}
                </div>
            `}
            <div class="fdp-bar-track">
                <div class="fdp-bar-fill ${isFree ? 'fdp-bar-done' : ''}" style="width:${percent}%"></div>
            </div>
            <div class="fdp-bar-labels">
                <span>${formatPrice(0)}</span>
                <span style="font-weight:700;color:${isFree ? '#10b981' : '#d4af37'}">
                    ${formatPrice(cartTotal)}
                </span>
                <span>${formatPrice(minAmount)} 🚚</span>
            </div>
            ${!isFree ? `
                <button class="fdp-shop-btn" onclick="closeFreeDeliveryPopup(); window.location.href='index.html'">
                    ${isAr ? 'أكمل التسوق' : 'Keep Shopping'}
                </button>
            ` : ''}
        </div>
    `;

    document.body.appendChild(popup);

    // Animate in
    requestAnimationFrame(() => popup.classList.add('fdp-visible'));

    // Auto-close after 6s if free
    if (isFree) setTimeout(closeFreeDeliveryPopup, 6000);
}

function closeFreeDeliveryPopup() {
    const popup = document.getElementById('freeDeliveryPopup');
    if (!popup) return;
    popup.classList.remove('fdp-visible');
    setTimeout(() => popup.remove(), 300);
}

// Inject popup styles once
(function injectFreeDeliveryStyles() {
    if (document.getElementById('fdpStyles')) return;
    const style = document.createElement('style');
    style.id = 'fdpStyles';
    style.textContent = `
        #freeDeliveryPopup {
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(120%);
            z-index: 99999;
            width: min(420px, calc(100vw - 32px));
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            filter: drop-shadow(0 8px 32px rgba(0,0,0,0.18));
        }
        #freeDeliveryPopup.fdp-visible {
            transform: translateX(-50%) translateY(0);
        }
        .fdp-inner {
            background: #fff;
            border-radius: 16px;
            padding: 20px 24px 18px;
            border: 2px solid #f0f0f0;
            position: relative;
            text-align: center;
        }
        .fdp-close {
            position: absolute;
            top: 10px; right: 12px;
            background: none; border: none;
            font-size: 14px; color: #aaa;
            cursor: pointer; line-height: 1;
        }
        .fdp-close:hover { color: #333; }
        .fdp-icon { font-size: 2rem; margin-bottom: 6px; }
        .fdp-title {
            font-size: 1rem;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 4px;
            line-height: 1.4;
        }
        .fdp-title.fdp-success { color: #10b981; }
        .fdp-sub {
            font-size: 0.82rem;
            color: #888;
            margin-bottom: 14px;
        }
        .fdp-bar-track {
            width: 100%;
            height: 10px;
            background: #f0f0f0;
            border-radius: 99px;
            overflow: hidden;
            margin-bottom: 6px;
        }
        .fdp-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #d4af37, #f0c040);
            border-radius: 99px;
            transition: width 0.8s ease;
        }
        .fdp-bar-fill.fdp-bar-done {
            background: linear-gradient(90deg, #10b981, #34d399);
        }
        .fdp-bar-labels {
            display: flex;
            justify-content: space-between;
            font-size: 0.75rem;
            color: #999;
            margin-bottom: 14px;
        }
        .fdp-shop-btn {
            width: 100%;
            padding: 10px;
            background: #1a1a1a;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 0.88rem;
            font-weight: 700;
            cursor: pointer;
            transition: background 0.2s ease;
        }
        .fdp-shop-btn:hover { background: #d4af37; }
        [dir="rtl"] .fdp-close { right: auto; left: 12px; }
    `;
    document.head.appendChild(style);
})();

// ==================== DELIVERY COUNTRIES ====================

async function loadDeliveryCountries() {
    const countrySelect = document.getElementById('deliveryCountry');
    if (!countrySelect) return;

    try {
        const countries = await getDeliveryCountries();

        if (countries.length === 0) {
            countrySelect.innerHTML = '<option value="">No delivery available yet</option>';
            return;
        }

        const jordanCountry = countries.find(c =>
            c.id === 'JO' ||
            c.id === 'jordan' ||
            (c.name_en && c.name_en.toLowerCase() === 'jordan') ||
            c.name_ar === 'الأردن'
        );
        const jordanId = jordanCountry ? jordanCountry.id : null;

        countrySelect.innerHTML =
            '<option value="" data-en="-- Select Country --" data-ar="-- اختر الدولة --">-- Select Country --</option>' +
            countries.map(country => `
                <option value="${country.id}"
                        data-name-en="${country.name_en}"
                        data-name-ar="${country.name_ar}"
                        data-prefix="${country.phone_prefix || country.phonePrefix || ''}"
                        ${country.id === jordanId ? 'selected' : ''}>
                    ${country.name_en} / ${country.name_ar}
                </option>
            `).join('');

        if (jordanId) {
            await loadDeliveryCities(jordanId);
            const prefix = jordanCountry.phone_prefix || jordanCountry.phonePrefix || '+962';
            const prefixEl = document.getElementById('phonePrefix');
            if (prefixEl) prefixEl.value = prefix;
        }

    } catch (error) {
        console.error('Error loading countries:', error);
        countrySelect.innerHTML = '<option value="">Error loading countries</option>';
    }
}

// ==================== DELIVERY CITIES ====================

async function loadDeliveryCities(countryId) {
    const citySelect = document.getElementById('deliveryCity');
    if (!citySelect) return;

    try {
        const cities = await getDeliveryCities(countryId);

        if (!cities || cities.length === 0) {
            citySelect.innerHTML = '<option value="">No cities available</option>';
            citySelect.disabled = true;
            resetDeliveryFee();
            return;
        }

        citySelect.disabled = false;
        citySelect.innerHTML =
            '<option value="" data-en="-- Select City --" data-ar="-- اختر المدينة --">-- Select City --</option>' +
            cities.map(city => `
                <option value="${city.id}"
                        data-name-en="${city.name_en}"
                        data-name-ar="${city.name_ar}"
                        data-delivery-fee="${city.displayed_fee || city.delivery_fee || 0}">
                    ${city.name_en} / ${city.name_ar}
                </option>
            `).join('');

    } catch (error) {
        console.error('Error loading cities:', error);
        citySelect.innerHTML = '<option value="">Error loading cities</option>';
        citySelect.disabled = true;
    }
}

// ==================== UPDATE DELIVERY FEE ====================

async function updateDeliveryFee() {
    const citySelect = document.getElementById('deliveryCity');
    const selectedOption = citySelect.options[citySelect.selectedIndex];

    if (!citySelect.value) {
        resetDeliveryFee();
        return;
    }

    const cityDeliveryFee = parseFloat(selectedOption.dataset.deliveryFee) || 0;

    // Get cart total
    const cart = getCart();
    const products = await getProducts();
    const cartTotal = cart.reduce((total, item) => {
        const product = products.find(p => String(p.id) === String(item.productId));
        if (product) {
            return total + (parseFloat(product.newPrice || 0) * item.quantity);
        }
        return total;
    }, 0);

    // Load minimum order amount from DB
    try {
        const info = await getGeneralInfoFromAPI();
        minimumOrderAmount = parseFloat(info.minimum_order_amount) || 15;
    } catch (e) {
        minimumOrderAmount = 15;
    }

    const isFree = cartTotal >= minimumOrderAmount && minimumOrderAmount > 0;

    if (isFree) {
        selectedDeliveryFee = 0;
        selectedActualFee = cityDeliveryFee;

        const freeText = (typeof currentLanguage !== 'undefined' && currentLanguage === 'ar')
            ? 'مجاناً ✓' : 'FREE ✓';

        document.getElementById('deliveryFeeDisplay').innerHTML =
            `<span style="color:#10b981;font-weight:700;">${freeText}</span>`;
    } else {
        selectedDeliveryFee = cityDeliveryFee;
        selectedActualFee = cityDeliveryFee;

        const remaining = minimumOrderAmount - cartTotal;
        const isAr = (typeof currentLanguage !== 'undefined' && currentLanguage === 'ar');
        const addText = isAr
            ? `أضف ${formatPrice(remaining)} للتوصيل المجاني`
            : `Add ${formatPrice(remaining)} for free delivery`;

        document.getElementById('deliveryFeeDisplay').innerHTML = `
            <span style="font-weight:700;">${formatPrice(cityDeliveryFee)}</span>
            ${minimumOrderAmount > 0 ? `
                <span style="display:block;font-size:0.75rem;color:#e74c3c;margin-top:2px;cursor:pointer;"
                      onclick="showFreeDeliveryPopup(${cartTotal}, ${minimumOrderAmount})">
                    ${addText}
                </span>
            ` : ''}
        `;
    }

    // Show the popup
    showFreeDeliveryPopup(cartTotal, minimumOrderAmount);
    updateOrderTotal();
}

function resetDeliveryFee() {
    selectedDeliveryFee = 0;
    selectedActualFee = 0;
    const displayEl = document.getElementById('deliveryFeeDisplay');
    if (displayEl) {
        const isAr = (typeof currentLanguage !== 'undefined' && currentLanguage === 'ar');
        displayEl.innerHTML = `<span style="color:#999;">${isAr ? 'اختر المدينة أولاً' : 'Select city first'}</span>`;
    }
    updateOrderTotal();
}

// ==================== ORDER TOTAL ====================

function updateOrderTotal() {
    const subtotalEl = document.getElementById('orderSubtotal');
    if (!subtotalEl) return;
    const subtotal = parseFloat(subtotalEl.textContent.replace(/[^0-9.]/g, '')) || 0;
    const total = subtotal + selectedDeliveryFee;
    const totalEl = document.getElementById('orderTotal');
    if (totalEl) totalEl.textContent = formatPrice(total);
}

// ==================== ORDER SUMMARY ====================

async function loadOrderSummary() {
    const cart = getCart();
    const orderItemsContainer = document.getElementById('orderItems');

    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    try {
        const products = await getProducts();
        let orderHTML = '';
        let subtotal = 0;

        cart.forEach(item => {
            const product = products.find(p => String(p.id) === String(item.productId));
            if (!product) return;

            const nameKey = `name_${typeof currentLanguage !== 'undefined' ? currentLanguage : 'en'}`;
            const price = parseFloat(product.newPrice || product.new_price || 0);
            const itemTotal = price * item.quantity;
            subtotal += itemTotal;

            orderHTML += `
                <div class="order-item">
                    <div class="order-item-info">
                        <div class="order-item-name">${product[nameKey] || product.name_en}</div>
                        <div class="order-item-qty">Qty: ${item.quantity}</div>
                    </div>
                    <div class="order-item-price">${formatPrice(itemTotal)}</div>
                </div>
            `;
        });

        orderItemsContainer.innerHTML = orderHTML;
        const subtotalEl = document.getElementById('orderSubtotal');
        if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);

        updateOrderTotal();

    } catch (error) {
        console.error('Error loading order summary:', error);
    }
}

// ==================== FORM SUBMISSION ====================

document.getElementById('checkoutForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn?.textContent;
    if (submitBtn) {
        submitBtn.textContent = 'Processing...';
        submitBtn.disabled = true;
    }

    try {
        const cart = getCart();
        const products = await getProducts();

        const countrySelect = document.getElementById('deliveryCountry');
        const citySelect = document.getElementById('deliveryCity');
        const selectedCountryOption = countrySelect.options[countrySelect.selectedIndex];
        const selectedCityOption = citySelect.options[citySelect.selectedIndex];

        const countryName = selectedCountryOption.dataset.nameEn;
        const cityName = selectedCityOption.dataset.nameEn;

        let subtotal = 0;
        const orderItems = cart.map(item => {
            const product = products.find(p => String(p.id) === String(item.productId));
            if (!product) return null;
            const price = parseFloat(product.newPrice || product.new_price || 0);
            const itemTotal = price * item.quantity;
            subtotal += itemTotal;
            return {
                productId: product.id,
                productName: product.name_en,
                productNameAr: product.name_ar,
                quantity: item.quantity,
                price: price,
                costPrice: product.costPrice || product.cost_price || 0,
                total: itemTotal
            };
        }).filter(Boolean);

        const orderId = 'ORD-' + Date.now();
        const phonePrefix = document.getElementById('phonePrefix')?.value || '';
        const phoneNumber = document.getElementById('customerPhone')?.value || '';
        const fullPhoneNumber = phonePrefix + phoneNumber;
        const completeAddress = document.getElementById('deliveryAddress')?.value || '';

        // ✅ FIX: Use shipping_fee instead of delivery_fee to match DB column
        // Only include fields your orders table actually has.
        // Remove delivery_fee / actual_delivery_fee if they don't exist in your DB.
        const orderData = {
            order_id: orderId,
            customer_name: document.getElementById('customerName')?.value,
            customer_phone: fullPhoneNumber,
            customer_email: document.getElementById('customerEmail')?.value || '',
            delivery_country: countryName,
            delivery_city: cityName,
            delivery_address: completeAddress,
            order_notes: document.getElementById('orderNotes')?.value || '',
            payment_method: document.querySelector('input[name="payment"]:checked')?.value || 'cash',
            items: orderItems,
            subtotal: subtotal,
            // DB columns: displayed_shipping_cost, actual_shipping_cost
            delivery_fee: selectedDeliveryFee,
            actual_delivery_fee: selectedActualFee,
            total: subtotal + selectedDeliveryFee,
            currency: (typeof currentCurrency !== 'undefined') ? currentCurrency : 'JOD',
            language: (typeof currentLanguage !== 'undefined') ? currentLanguage : 'en',
            order_status: 'pending'
        };

        const result = await createOrder(orderData);

        if (result.success || result.order) {
            clearCart();
            closeFreeDeliveryPopup();

            const orderIdEl = document.getElementById('orderIdDisplay');
            if (orderIdEl) orderIdEl.textContent = orderId;

            const modal = document.getElementById('successModal');
            if (modal) modal.classList.add('show');

            if (typeof switchLanguage === 'function') switchLanguage(currentLanguage);
        } else {
            throw new Error(result.error || 'Failed to create order');
        }

    } catch (error) {
        console.error('Order submission error:', error);
        alert('Error creating order: ' + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
});

// ==================== EVENT LISTENERS ====================

document.getElementById('deliveryCountry')?.addEventListener('change', async function () {
    const countryId = this.value;
    if (countryId) {
        await loadDeliveryCities(countryId);
        const selectedOption = this.options[this.selectedIndex];
        const prefix = selectedOption.dataset.prefix || '+962';
        const prefixEl = document.getElementById('phonePrefix');
        if (prefixEl) prefixEl.value = prefix;
    }
});

document.getElementById('deliveryCity')?.addEventListener('change', updateDeliveryFee);

// ==================== MODAL CLOSE ====================

function closeSuccessModal() {
    window.location.href = 'index.html';
}

// ==================== INITIALIZATION ====================

(async function initCheckout() {
    await loadDeliveryCountries();
    await loadOrderSummary();
    if (typeof switchLanguage === 'function') switchLanguage(currentLanguage);
    console.log('✅ Checkout initialized');
})();