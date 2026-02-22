// ==================== CHECKOUT.JS - DELIVERY & ORDER PROCESSING ====================
// Uses api.js for database calls

let selectedDeliveryFee = 0;
let selectedActualFee = 0;

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

        // Find Jordan (default)
        const jordanCountry = countries.find(c =>
            c.id === 'JO' ||
            c.id === 'jordan' ||
            (c.name_en && c.name_en.toLowerCase() === 'jordan') ||
            c.name_ar === 'الأردن'
        );

        const jordanId = jordanCountry ? jordanCountry.id : null;

        countrySelect.innerHTML = '<option value="" data-en="-- Select Country --" data-ar="-- اختر الدولة --">-- Select Country --</option>' +
            countries.map(country => `
                <option value="${country.id}" 
                        data-name-en="${country.name_en}" 
                        data-name-ar="${country.name_ar}"
                        data-prefix="${country.phone_prefix || country.phonePrefix || ''}"
                        ${country.id === jordanId ? 'selected' : ''}>
                    ${country.name_en} / ${country.name_ar}
                </option>
            `).join('');

        // Auto-load Jordan's cities
        if (jordanId) {
            await loadDeliveryCities(jordanId);

            // Update phone prefix
            const prefix = jordanCountry.phone_prefix || jordanCountry.phonePrefix || '+962';
            if (typeof updatePhonePrefix === 'function') {
                updatePhonePrefix(prefix);
            } else {
                const prefixEl = document.getElementById('phonePrefix');
                if (prefixEl) prefixEl.value = prefix;
            }
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
        citySelect.innerHTML = '<option value="" data-en="-- Select City --" data-ar="-- اختر المدينة --">-- Select City --</option>' +
            cities.map(city => `
                <option value="${city.id}" 
                        data-name-en="${city.name_en}"
                        data-name-ar="${city.name_ar}"
                        data-delivery-fee="${city.delivery_fee || 0}">
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

    // Get delivery fee from city
    const cityDeliveryFee = parseFloat(selectedOption.dataset.deliveryFee) || 0;

    // Get current cart total
    const cart = getCart();
    const products = await getProducts(); // ✅ Now async!
    
    const cartTotal = cart.reduce((total, item) => {
        const product = products.find(p => String(p.id) === String(item.productId));
        if (product) {
            const price = parseFloat(product.newPrice || product.new_price || 0);
            return total + (price * item.quantity);
        }
        return total;
    }, 0);

    // Get minimum order amount
    let minimumOrderAmount = 15;
    try {
        if (typeof window.loadGeneralInfo === 'function') {
            const info = await window.loadGeneralInfo();
            minimumOrderAmount = parseFloat(info.minimum_order_amount) || 15;
        } else if (typeof API !== 'undefined' && typeof API.getGeneralInfo === 'function') {
            const info = await API.getGeneralInfo();
            minimumOrderAmount = parseFloat(info.minimum_order_amount) || 15;
        }
    } catch (error) {
        console.error('Error fetching minimum order amount:', error);
    }

    // Check if free delivery applies
    if (cartTotal >= minimumOrderAmount && minimumOrderAmount > 0) {
        // FREE DELIVERY
        selectedDeliveryFee = 0;
        selectedActualFee = cityDeliveryFee;

        const freeText = (typeof currentLanguage !== 'undefined' && currentLanguage === 'ar')
            ? 'مجاناً ✓'
            : 'FREE ✓';

        // const metText = currentLanguage === 'ar'
        //     ? `تم تجاوز الحد الأدنى ${formatPrice(minimumOrderAmount)}`
        //     : `Minimum ${formatPrice(minimumOrderAmount)} met`;

        document.getElementById('deliveryFeeDisplay').innerHTML = `
            <span style="color: #10b981; font-weight: 700;">${freeText}</span>
            <span style="display:block;font-size:0.75rem;color:#666;margin-top:2px;">
               
            </span>
        `;
    } else {
        // PAID DELIVERY
        selectedDeliveryFee = cityDeliveryFee;
        selectedActualFee = cityDeliveryFee;

        const remaining = minimumOrderAmount - cartTotal;
        const addText = currentLanguage === 'ar'
            ? `أضف ${formatPrice(remaining)} للتوصيل المجاني`
            : `Add ${formatPrice(remaining)} for free delivery`;

        document.getElementById('deliveryFeeDisplay').innerHTML = `
            <span style="font-weight: 700;">${formatPrice(cityDeliveryFee)}</span>
            ${minimumOrderAmount > 0 ? `
                <span style="display:block;font-size:0.75rem;color:#e74c3c;margin-top:2px;">
                    ${addText}
                </span>
            ` : ''}
        `;
    }

    updateOrderTotal();
}

function resetDeliveryFee() {
    selectedDeliveryFee = 0;
    selectedActualFee = 0;

    const displayEl = document.getElementById('deliveryFeeDisplay');
    if (displayEl) {
        displayEl.innerHTML = (typeof currentLanguage !== 'undefined' && currentLanguage === 'ar')
            ? '<span style="color:#999;">اختر المدينة أولاً</span>'
            : '<span style="color:#999;">Select city first</span>';
    }

    updateOrderTotal();
}

// ==================== ORDER TOTAL ====================

function updateOrderTotal() {
    const subtotalEl = document.getElementById('orderSubtotal');
    if (!subtotalEl) return;

    const subtotalText = subtotalEl.textContent;
    const subtotal = parseFloat(subtotalText.replace(/[^0-9.]/g, '')) || 0;
    const total = subtotal + selectedDeliveryFee;
    
    const totalEl = document.getElementById('orderTotal');
    if (totalEl) {
        totalEl.textContent = formatPrice(total);
    }
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
        const products = await getProducts(); // ✅ Now async!
        
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
        if (subtotalEl) {
            subtotalEl.textContent = formatPrice(subtotal);
        }
        
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
        const products = await getProducts(); // ✅ Now async!

        // Get selected country and city
        const countrySelect = document.getElementById('deliveryCountry');
        const citySelect = document.getElementById('deliveryCity');

        const selectedCountryOption = countrySelect.options[countrySelect.selectedIndex];
        const selectedCityOption = citySelect.options[citySelect.selectedIndex];

        const countryName = selectedCountryOption.dataset.nameEn;
        const cityName = selectedCityOption.dataset.nameEn;

        // Calculate totals
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

        // Build complete address
        const street = document.getElementById('deliveryStreet')?.value || '';
        const building = document.getElementById('deliveryBuilding')?.value || '';
        const floor = document.getElementById('deliveryFloor')?.value || '';
        const completeAddress = `${street}, ${building}${floor ? ', ' + floor : ''}`;

        // Create order ID
        const orderId = 'ORD-' + Date.now();

        // Get phone
        const phonePrefix = document.getElementById('phonePrefix')?.value || '';
        const phoneNumber = document.getElementById('customerPhone')?.value || '';
        const fullPhoneNumber = phonePrefix + phoneNumber;

        const orderData = {
            order_id: orderId,
            customer_name: document.getElementById('customerName')?.value,
            customer_phone: fullPhoneNumber,
            customer_email: document.getElementById('customerEmail')?.value || '',
            delivery_country: countryName,
            delivery_city: cityName,
            delivery_street: street,
            delivery_building: building,
            delivery_floor: floor || '',
            delivery_address: completeAddress,
            order_notes: document.getElementById('orderNotes')?.value || '',
            payment_method: document.querySelector('input[name="payment"]:checked')?.value || 'cash',
            items: orderItems,
            subtotal: subtotal,
            delivery_fee: selectedDeliveryFee,
            actual_delivery_fee: selectedActualFee,
            total: subtotal + selectedDeliveryFee,
            currency: (typeof currentCurrency !== 'undefined') ? currentCurrency : 'JOD',
            language: (typeof currentLanguage !== 'undefined') ? currentLanguage : 'en',
            order_status: 'pending'
        };

        // Save to database via API
        const result = await createOrder(orderData);

        if (result.success || result.order) {
            // Clear cart
            clearCart();

            // Show success modal
            const orderIdEl = document.getElementById('orderIdDisplay');
            if (orderIdEl) orderIdEl.textContent = orderId;
            
            const modal = document.getElementById('successModal');
            if (modal) modal.classList.add('show');
            
            if (typeof switchLanguage === 'function' && typeof currentLanguage !== 'undefined') {
                switchLanguage(currentLanguage);
            }
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

// ==================== COUNTRY CHANGE HANDLER ====================

document.getElementById('deliveryCountry')?.addEventListener('change', async function() {
    const countryId = this.value;
    if (countryId) {
        await loadDeliveryCities(countryId);
        
        // Update phone prefix
        const selectedOption = this.options[this.selectedIndex];
        const prefix = selectedOption.dataset.prefix || '+962';
        const prefixEl = document.getElementById('phonePrefix');
        if (prefixEl) prefixEl.value = prefix;
    }
});

// ==================== CITY CHANGE HANDLER ====================

document.getElementById('deliveryCity')?.addEventListener('change', updateDeliveryFee);

// ==================== MODAL CLOSE ====================

function closeSuccessModal() {
    window.location.href = 'index.html';
}

// ==================== INITIALIZATION ====================

(async function initCheckout() {
    await loadDeliveryCountries();
    await loadOrderSummary();
    
    if (typeof switchLanguage === 'function' && typeof currentLanguage !== 'undefined') {
        switchLanguage(currentLanguage);
    }
    
    console.log('✅ Checkout initialized');
})();