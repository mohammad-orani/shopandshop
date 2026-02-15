// ========================================
// DELIVERY FEES FUNCTIONALITY
// ========================================

let selectedDeliveryFee = 0;
let selectedActualFee = 0;

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
    
    countrySelect.innerHTML = '<option value="" data-en="-- Select Country --" data-ar="-- اختر الدولة --">-- Select Country --</option>' +
        countries.map(country => `
            <option value="${country.id}" 
                    data-name-en="${country.name_en}" 
                    data-name-ar="${country.name_ar}"
                    data-prefix="${country.phonePrefix}">
                ${country.name_en} / ${country.name_ar}
            </option>
        `).join('');
}

// Load cities when country is selected
function loadCitiesForCheckout() {
    const countryId = parseInt(document.getElementById('deliveryCountry').value);
    const citySelect = document.getElementById('deliveryCity');
    
    if (!countryId) {
        citySelect.disabled = true;
        citySelect.innerHTML = '<option value="" data-en="-- Select City --" data-ar="-- اختر المدينة --">-- Select City --</option>';
        resetDeliveryFee();
        return;
    }
    
    // Update phone prefix based on selected country
    const countrySelect = document.getElementById('deliveryCountry');
    const selectedOption = countrySelect.options[countrySelect.selectedIndex];
    const phonePrefix = selectedOption.getAttribute('data-prefix');
    if (phonePrefix && document.getElementById('phonePrefix')) {
        document.getElementById('phonePrefix').value = phonePrefix;
    }
    
    // Get cities for selected country
    const cities = getCitiesByCountry(countryId);
    
    if (cities.length === 0) {
        citySelect.disabled = true;
        citySelect.innerHTML = '<option value="">No cities available</option>';
        resetDeliveryFee();
        return;
    }
    
    citySelect.disabled = false;
    citySelect.innerHTML = '<option value="" data-en="-- Select City --" data-ar="-- اختر المدينة --">-- Select City --</option>' +
        cities.map(city => `
            <option value="${city.id}" 
                    data-name-en="${city.name_en}" 
                    data-name-ar="${city.name_ar}"
                    data-displayed-fee="0"
                    data-actual-fee="${city.fee}">
                ${city.name_en} / ${city.name_ar}
            </option>
        `).join('');
    
    resetDeliveryFee();
}

// Update delivery fee when city is selected
function updateDeliveryFee() {
    const citySelect = document.getElementById('deliveryCity');
    const selectedOption = citySelect.options[citySelect.selectedIndex];
    
    if (!citySelect.value) {
        resetDeliveryFee();
        return;
    }
    
    // Always set delivery fee to 0 (FREE) - customer pays nothing
    selectedDeliveryFee = 0;
    selectedActualFee = parseFloat(selectedOption.dataset.actualFee) || 0; // Keep actual cost for internal tracking
    
    // Display "FREE" instead of price
    const freeText = (typeof currentLanguage !== 'undefined' && currentLanguage === 'ar') ? 'مجاناً ✓' : 'FREE ✓';
    document.getElementById('deliveryFeeDisplay').innerHTML = `<span style="color: #10b981; font-weight: 700;">${freeText}</span>`;
    updateOrderTotal();
}

// Reset delivery fee
function resetDeliveryFee() {
    selectedDeliveryFee = 0;
    selectedActualFee = 0;
    const lang = (typeof currentLanguage !== 'undefined') ? currentLanguage : 'en';
    document.getElementById('deliveryFeeDisplay').textContent = lang === 'ar' ? 'اختر المدينة' : 'Select city';
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
    document.getElementById('orderSubtotal').textContent = formatPrice(subtotal);
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

document.getElementById('checkoutForm').addEventListener('submit', function(e) {
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
