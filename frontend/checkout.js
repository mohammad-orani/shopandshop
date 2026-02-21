// ========================================
// DELIVERY FEES FUNCTIONALITY
// ========================================

let selectedDeliveryFee = 0;
let selectedActualFee = 0;
const API_URL = 'https://primejo-ecommerce-backend-demo.up.railway.app/api';

// Get delivery data from localStorage (NEW SYSTEM)
function getDeliveryCountries() {
    return getCountriesWithCities(); // Use new function from countries-data.js
}

// Load countries on page load
function loadDeliveryCountries() {
    const countries = getCountriesWithCities();
    const countrySelect = document.getElementById('deliveryCountry');

    if (!countrySelect) return;

    if (countries.length === 0) {
        countrySelect.innerHTML = '<option value="">No delivery available yet</option>';
        return;
    }

    // Find Jordan's ID (common IDs: 'JO', 'jordan', or number)
    const jordanCountry = countries.find(c =>
        c.id === 'JO' ||
        c.id === 'jordan' ||
        c.name_en.toLowerCase() === 'jordan' ||
        c.name_ar === 'الأردن'
    );

    const jordanId = jordanCountry ? jordanCountry.id : null;

    countrySelect.innerHTML = '<option value="" data-en="-- Select Country --" data-ar="-- اختر الدولة --">-- Select Country --</option>' +
        countries.map(country => `
            <option value="${country.id}" 
                    data-name-en="${country.name_en}" 
                    data-name-ar="${country.name_ar}"
                    data-prefix="${country.phonePrefix}"
                    ${country.id === jordanId ? 'selected' : ''}>
                ${country.name_en} / ${country.name_ar}
            </option>
        `).join('');

    // If Jordan is found, trigger city load
    if (jordanId) {
        loadDeliveryCities(jordanId);

        // Update phone prefix if function exists
        if (typeof updatePhonePrefix === 'function') {
            const prefix = jordanCountry.phonePrefix || '+962';
            updatePhonePrefix(prefix);
        }
    }
}

// Load cities when country is selected
async function loadDeliveryCities(countryId) {
    const citySelect = document.getElementById('deliveryCity');
    if (!citySelect) return;

    try {
        const response = await fetch(`${API_URL}/delivery/cities/${countryId}`);
        const data = await response.json();

        if (!data.cities || data.cities.length === 0) {
            citySelect.innerHTML = '<option value="">No cities available</option>';
            citySelect.disabled = true;
            resetDeliveryFee();
            return;
        }

        citySelect.disabled = false;
        citySelect.innerHTML = '<option value="">-- Select City --</option>' +
            data.cities.map(city => `
                <option value="${city.id}" 
                        data-name-en="${city.name_en}"
                        data-name-ar="${city.name_ar}"
                        data-delivery-fee="${city.delivery_fee || 0}"
                        data-actual-fee="${city.delivery_fee || 0}">
                    ${city.name_en} / ${city.name_ar} - ${formatPrice(city.delivery_fee || 0)}
                </option>
            `).join('');

        // Trigger delivery fee update
        citySelect.addEventListener('change', updateDeliveryFee);

    } catch (error) {
        console.error('Error loading cities:', error);
        citySelect.innerHTML = '<option value="">Error loading cities</option>';
        citySelect.disabled = true;
    }
}

// Update delivery fee when city is selected
async function updateDeliveryFee() {
    const citySelect = document.getElementById('deliveryCity');
    const selectedOption = citySelect.options[citySelect.selectedIndex];

    if (!citySelect.value) {
        resetDeliveryFee();
        return;
    }

    // Get delivery fee from database (stored in data attribute)
    const cityDeliveryFee = parseFloat(selectedOption.dataset.deliveryFee || selectedOption.dataset.actualFee) || 0;

    // Get current cart total
    const cart = getCart();
    const products = getProducts();
    const cartTotal = cart.reduce((total, item) => {
        const product = products.find(p => String(p.id) === String(item.productId));
        if (product) {
            const price = parseFloat(product.newPrice || product.new_price || 0);
            return total + (price * item.quantity);
        }
        return total;
    }, 0);

    // Get minimum order amount from general info (uses cache if available)
    let minimumOrderAmount = 15; // Default fallback
    try {
        // Use the global loadGeneralInfo function if available
        if (typeof window.loadGeneralInfo === 'function') {
            const info = await window.loadGeneralInfo();
            minimumOrderAmount = parseFloat(info.minimum_order_amount) || 15;
        } else {
            // Fallback to direct API call
            const response = await fetch(`${API_URL}/general-info`);
            const data = await response.json();
            if (data.success && data.info) {
                minimumOrderAmount = parseFloat(data.info.minimum_order_amount) || 15;
            }
        }
    } catch (error) {
        console.error('Error fetching minimum order amount:', error);
        minimumOrderAmount = 15; // Use default on error
    }

    // Check if cart total meets minimum for free delivery
    if (cartTotal >= minimumOrderAmount && minimumOrderAmount > 0) {
        // FREE DELIVERY - order meets minimum
        selectedDeliveryFee = 0;
        selectedActualFee = cityDeliveryFee; // Keep actual cost for internal tracking

        const freeText = (typeof currentLanguage !== 'undefined' && currentLanguage === 'ar')
            ? 'مجاناً ✓'
            : 'FREE ✓';

        const metText = currentLanguage === 'ar'
            ? `تم تجاوز الحد الأدنى ${formatPrice(minimumOrderAmount)}`
            : `Minimum ${formatPrice(minimumOrderAmount)} met`;

        document.getElementById('deliveryFeeDisplay').innerHTML = `
            <span style="color: #10b981; font-weight: 700;">${freeText}</span>
            <span style="display:block;font-size:0.75rem;color:#666;margin-top:2px;">
                ${metText}
            </span>
        `;
    } else {
        // PAID DELIVERY - order below minimum
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
        displayEl.innerHTML = currentLanguage === 'ar'
            ? '<span style="color:#999;">اختر المدينة أولاً</span>'
            : '<span style="color:#999;">Select city first</span>';
    }

    updateOrderTotal();
}

function resetDeliveryFee() {
    selectedDeliveryFee = 0;
    selectedActualFee = 0;

    const displayEl = document.getElementById('deliveryFeeDisplay');
    if (displayEl) {
        displayEl.innerHTML = currentLanguage === 'ar'
            ? '<span style="color:#999;">اختر المدينة أولاً</span>'
            : '<span style="color:#999;">Select city first</span>';
    }

    updateOrderTotal();
}

// Update order total
function updateOrderTotal() {
    const subtotalText = document.getElementById('orderSubtotal').textContent;
    const subtotal = parseFloat(subtotalText.replace(/[^0-9.]/g, '')) || 0;
    const total = subtotal + selectedDeliveryFee;
    document.getElementById('orderTotal').textContent = formatPrice(total);
}

// ========================================
// ORDER SUMMARY
// ========================================

function loadOrderSummary() {
    const cart = getCart();
    const products = getProducts();
    const orderItemsContainer = document.getElementById('orderItems');

    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    let orderHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return;

        const nameKey = `name_${currentLanguage}`;
        const itemTotal = product.newPrice * item.quantity;
        subtotal += itemTotal;

        orderHTML += `
            <div class="order-item">
                <div class="order-item-info">
                    <div class="order-item-name">${product[nameKey]}</div>
                    <div class="order-item-qty">Qty: ${item.quantity}</div>
                </div>
                <div class="order-item-price">${formatPrice(itemTotal)}</div>
            </div>
        `;
    });

    orderItemsContainer.innerHTML = orderHTML;
    document.getElementById('orderSubtotal').textContent = subtotal;
    updateOrderTotal();
}

function saveOrder(orderData) {
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(orderData);
    localStorage.setItem('orders', JSON.stringify(orders));
}

// ========================================
// FORM SUBMISSION
// ========================================

document.getElementById('checkoutForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const cart = getCart();
    const products = getProducts();

    // Get selected country and city details
    const countrySelect = document.getElementById('deliveryCountry');
    const citySelect = document.getElementById('deliveryCity');

    const selectedCountryOption = countrySelect.options[countrySelect.selectedIndex];
    const selectedCityOption = citySelect.options[citySelect.selectedIndex];

    const countryName = selectedCountryOption.dataset.nameEn;
    const cityName = selectedCityOption.dataset.nameEn;

    // Calculate totals with current currency
    let subtotal = 0;
    const orderItems = cart.map(item => {
        const product = products.find(p => p.id === item.productId);
        const itemTotal = product.newPrice * item.quantity;
        subtotal += itemTotal;
        return {
            productId: product.id,
            productName: product.name_en,
            productNameAr: product.name_ar,
            quantity: item.quantity,
            price: product.newPrice,
            costPrice: product.cost_price || 0, // Include cost price for reports
            total: itemTotal
        };
    });

    // Get complete address
    const completeAddress = document.getElementById('deliveryAddress').value;

    // Create order
    const orderId = 'ORD-' + Date.now();

    // Get phone prefix and number
    const phonePrefix = document.getElementById('phonePrefix').value;
    const phoneNumber = document.getElementById('customerPhone').value;
    const fullPhoneNumber = phonePrefix + phoneNumber;

    const orderData = {
        orderId: orderId,
        customerName: document.getElementById('customerName').value,
        customerPhone: fullPhoneNumber, // Combined prefix + number
        deliveryCountry: countryName,
        deliveryCity: cityName,
        deliveryAddress: completeAddress,
        orderNotes: document.getElementById('orderNotes').value,
        paymentMethod: document.querySelector('input[name="payment"]:checked').value,
        items: orderItems,
        subtotal: subtotal,
        displayedShipping: selectedDeliveryFee, // What customer sees
        actualShipping: selectedActualFee, // Real cost for reports
        total: subtotal + selectedDeliveryFee,
        currency: (typeof currentCurrency !== 'undefined') ? currentCurrency : 'USD',
        currencyRate: (typeof currencyRates !== 'undefined') ? currencyRates[currentCurrency || 'USD'] : 1,
        status: 'pending',
        orderDate: new Date().toISOString(),
        language: (typeof currentLanguage !== 'undefined') ? currentLanguage : 'en'
    };

    // Save order
    saveOrder(orderData);

    // Clear cart
    localStorage.setItem('cart', JSON.stringify([]));
    updateCartCount();

    // Show success modal
    document.getElementById('orderIdDisplay').textContent = orderId;
    document.getElementById('successModal').classList.add('show');
    switchLanguage(currentLanguage);
});

// ========================================
// INITIALIZATION
// ========================================

// Load everything on page load
loadDeliveryCountries();
loadOrderSummary();
switchLanguage(currentLanguage);
