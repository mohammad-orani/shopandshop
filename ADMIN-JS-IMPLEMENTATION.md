# 🔧 JavaScript Implementation for Admin Panel

## Complete Admin.js Updates Needed

This document shows exactly what needs to be added to `admin/admin.js` to make all new features work.

---

## 1. Product Management Updates

### Add to Product Save Function:

```javascript
// Update saveProduct() function to include new fields

function saveProduct(event) {
    event.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const product = {
        id: productId || Date.now(),
        name_en: document.getElementById('productNameEn').value,
        name_ar: document.getElementById('productNameAr').value,
        description_en: document.getElementById('productDescEn').value,
        description_ar: document.getElementById('productDescAr').value,
        category: document.getElementById('productCategory').value,
        
        // NEW FIELDS
        cost_price: parseFloat(document.getElementById('productCostPrice').value) || 0,
        quantity_to_sell: parseInt(document.getElementById('productQuantityToSell').value) || 0,
        stock: parseInt(document.getElementById('productStock').value),
        
        old_price: parseFloat(document.getElementById('productOldPrice').value),
        new_price: parseFloat(document.getElementById('productNewPrice').value),
        image: document.getElementById('productImage').value,
        additional_images: document.getElementById('productAdditionalImages').value.split(',').map(url => url.trim()).filter(url => url),
        video_url: document.getElementById('productVideo').value,
        isOffer: document.getElementById('productOffer').checked,
        topSeller: document.getElementById('productTopSeller').checked,
        isVisible: document.getElementById('productVisible').checked
    };
    
    // Save to localStorage or send to API
    const products = getProducts();
    
    if (productId) {
        const index = products.findIndex(p => p.id == productId);
        if (index !== -1) {
            products[index] = product;
        }
    } else {
        products.push(product);
    }
    
    saveProducts(products);
    loadProducts();
    hideProductForm();
    alert('Product saved successfully!');
}
```

### Update Product Table Display:

```javascript
// Update loadProducts() to show new fields in table

function loadProducts() {
    const products = getProducts();
    const tbody = document.getElementById('productsTableBody');
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No products found. Add your first product!</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td><img src="${product.image}" alt="${product.name_en}" style="width: 50px; height: 50px; object-fit: cover;"></td>
            <td>
                <strong>${product.name_en}</strong><br>
                <small>Cost: $${product.cost_price || 0}</small>
            </td>
            <td>${product.category}</td>
            <td>$${product.new_price}</td>
            <td>
                <strong>Stock:</strong> ${product.stock}<br>
                <small style="color: green;">Selling: ${product.quantity_to_sell || 0}</small>
            </td>
            <td>${product.isVisible ? '✅ Visible' : '❌ Hidden'}</td>
            <td>
                <button onclick="editProduct(${product.id})" class="btn-secondary">Edit</button>
                <button onclick="deleteProduct(${product.id})" class="btn-danger">Delete</button>
            </td>
        </tr>
    `).join('');
}
```

### Update Edit Product Function:

```javascript
// Update editProduct() to load new fields

function editProduct(id) {
    const products = getProducts();
    const product = products.find(p => p.id == id);
    
    if (!product) return;
    
    document.getElementById('productId').value = product.id;
    document.getElementById('productNameEn').value = product.name_en;
    document.getElementById('productNameAr').value = product.name_ar;
    document.getElementById('productDescEn').value = product.description_en;
    document.getElementById('productDescAr').value = product.description_ar;
    document.getElementById('productCategory').value = product.category;
    
    // NEW FIELDS
    document.getElementById('productCostPrice').value = product.cost_price || 0;
    document.getElementById('productQuantityToSell').value = product.quantity_to_sell || 0;
    document.getElementById('productStock').value = product.stock;
    
    document.getElementById('productOldPrice').value = product.old_price;
    document.getElementById('productNewPrice').value = product.new_price;
    document.getElementById('productImage').value = product.image;
    document.getElementById('productAdditionalImages').value = product.additional_images ? product.additional_images.join(', ') : '';
    document.getElementById('productVideo').value = product.video_url || '';
    document.getElementById('productOffer').checked = product.isOffer;
    document.getElementById('productTopSeller').checked = product.topSeller;
    document.getElementById('productVisible').checked = product.isVisible;
    
    document.getElementById('formTitle').textContent = 'Edit Product';
    document.getElementById('productForm').style.display = 'block';
    window.scrollTo(0, 0);
}
```

---

## 2. Delivery Fees Management

### Add Complete Delivery Management Functions:

```javascript
// ========================================
// DELIVERY FEES MANAGEMENT
// ========================================

// Storage keys
const COUNTRIES_KEY = 'delivery_countries';
const CITIES_KEY = 'delivery_cities';

// Get delivery data
function getDeliveryCountries() {
    return JSON.parse(localStorage.getItem(COUNTRIES_KEY) || '[]');
}

function getDeliveryCities() {
    return JSON.parse(localStorage.getItem(CITIES_KEY) || '[]');
}

function saveDeliveryCountries(countries) {
    localStorage.setItem(COUNTRIES_KEY, JSON.stringify(countries));
}

function saveDeliveryCities(cities) {
    localStorage.setItem(CITIES_KEY, JSON.stringify(cities));
}

// Show/Hide Forms
function showAddCountryForm() {
    document.getElementById('countryForm').style.display = 'block';
    document.getElementById('countryFormElement').reset();
}

function hideCountryForm() {
    document.getElementById('countryForm').style.display = 'none';
}

function showAddCityForm() {
    const countryId = document.getElementById('deliveryCountrySelect').value;
    if (!countryId) {
        alert('Please select a country first!');
        return;
    }
    
    document.getElementById('cityCountryId').value = countryId;
    document.getElementById('cityForm').style.display = 'block';
    document.getElementById('cityFormElement').reset();
}

function hideCityForm() {
    document.getElementById('cityForm').style.display = 'none';
}

// Add Country
function addCountry(event) {
    event.preventDefault();
    
    const countries = getDeliveryCountries();
    const newCountry = {
        id: Date.now(),
        name_en: document.getElementById('countryNameEn').value,
        name_ar: document.getElementById('countryNameAr').value,
        default_fee: parseFloat(document.getElementById('countryDefaultFee').value),
        is_active: true,
        created_at: new Date().toISOString()
    };
    
    countries.push(newCountry);
    saveDeliveryCountries(countries);
    
    loadCountries();
    hideCountryForm();
    alert('Country added successfully!');
}

// Load Countries
function loadCountries() {
    const countries = getDeliveryCountries();
    
    // Update countries table
    const tbody = document.getElementById('countriesTableBody');
    if (countries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No countries added yet.</td></tr>';
    } else {
        tbody.innerHTML = countries.map(country => `
            <tr>
                <td>${country.name_en}</td>
                <td>${country.name_ar}</td>
                <td>${country.default_fee.toFixed(2)} JD</td>
                <td>${country.is_active ? '✅ Active' : '❌ Inactive'}</td>
                <td>
                    <button onclick="toggleCountryStatus(${country.id})" class="btn-secondary">
                        ${country.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onclick="deleteCountry(${country.id})" class="btn-danger">Delete</button>
                </td>
            </tr>
        `).join('');
    }
    
    // Update country selector
    const selector = document.getElementById('deliveryCountrySelect');
    selector.innerHTML = '<option value="">-- Select Country --</option>' +
        countries.filter(c => c.is_active).map(country => `
            <option value="${country.id}">${country.name_en} / ${country.name_ar}</option>
        `).join('');
}

// Toggle Country Status
function toggleCountryStatus(countryId) {
    const countries = getDeliveryCountries();
    const country = countries.find(c => c.id === countryId);
    
    if (country) {
        country.is_active = !country.is_active;
        saveDeliveryCountries(countries);
        loadCountries();
    }
}

// Delete Country
function deleteCountry(countryId) {
    if (!confirm('Delete this country? All cities will also be deleted!')) return;
    
    const countries = getDeliveryCountries().filter(c => c.id !== countryId);
    const cities = getDeliveryCities().filter(c => c.country_id !== countryId);
    
    saveDeliveryCountries(countries);
    saveDeliveryCities(cities);
    
    loadCountries();
    alert('Country deleted successfully!');
}

// Add City
function addCity(event) {
    event.preventDefault();
    
    const cities = getDeliveryCities();
    const newCity = {
        id: Date.now(),
        country_id: parseInt(document.getElementById('cityCountryId').value),
        name_en: document.getElementById('cityNameEn').value,
        name_ar: document.getElementById('cityNameAr').value,
        displayed_fee: parseFloat(document.getElementById('cityDisplayedFee').value),
        actual_fee: parseFloat(document.getElementById('cityActualFee').value),
        is_active: true,
        created_at: new Date().toISOString()
    };
    
    cities.push(newCity);
    saveDeliveryCities(cities);
    
    loadCitiesForCountry();
    hideCityForm();
    alert('City added successfully!');
}

// Load Cities for Selected Country
function loadCitiesForCountry() {
    const countryId = parseInt(document.getElementById('deliveryCountrySelect').value);
    
    if (!countryId) {
        document.getElementById('citiesTableContainer').style.display = 'none';
        document.getElementById('addCityBtn').disabled = true;
        return;
    }
    
    document.getElementById('addCityBtn').disabled = false;
    
    const cities = getDeliveryCities().filter(c => c.country_id === countryId);
    const tbody = document.getElementById('citiesTableBody');
    const container = document.getElementById('citiesTableContainer');
    
    if (cities.length === 0) {
        container.style.display = 'none';
    } else {
        container.style.display = 'block';
        tbody.innerHTML = cities.map(city => `
            <tr>
                <td>${city.name_en}</td>
                <td>${city.name_ar}</td>
                <td style="color: green; font-weight: bold;">${city.displayed_fee.toFixed(2)} JD</td>
                <td style="color: ${city.actual_fee > city.displayed_fee ? 'red' : 'green'}; font-weight: bold;">
                    ${city.actual_fee.toFixed(2)} JD
                    ${city.actual_fee > city.displayed_fee ? '<br><small>(Override)</small>' : ''}
                </td>
                <td>${city.is_active ? '✅ Active' : '❌ Inactive'}</td>
                <td>
                    <button onclick="editCity(${city.id})" class="btn-secondary">Edit</button>
                    <button onclick="toggleCityStatus(${city.id})" class="btn-secondary">
                        ${city.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onclick="deleteCity(${city.id})" class="btn-danger">Delete</button>
                </td>
            </tr>
        `).join('');
    }
}

// Toggle City Status
function toggleCityStatus(cityId) {
    const cities = getDeliveryCities();
    const city = cities.find(c => c.id === cityId);
    
    if (city) {
        city.is_active = !city.is_active;
        saveDeliveryCities(cities);
        loadCitiesForCountry();
    }
}

// Delete City
function deleteCity(cityId) {
    if (!confirm('Delete this city?')) return;
    
    const cities = getDeliveryCities().filter(c => c.id !== cityId);
    saveDeliveryCities(cities);
    
    loadCitiesForCountry();
    alert('City deleted successfully!');
}

// Edit City (optional enhancement)
function editCity(cityId) {
    const cities = getDeliveryCities();
    const city = cities.find(c => c.id === cityId);
    
    if (!city) return;
    
    document.getElementById('cityCountryId').value = city.country_id;
    document.getElementById('cityNameEn').value = city.name_en;
    document.getElementById('cityNameAr').value = city.name_ar;
    document.getElementById('cityDisplayedFee').value = city.displayed_fee;
    document.getElementById('cityActualFee').value = city.actual_fee;
    
    // Store city ID for update
    document.getElementById('cityFormElement').dataset.editId = cityId;
    
    document.getElementById('cityForm').style.display = 'block';
}

// Initialize Delivery Management
function initDeliveryManagement() {
    // Load countries on page load
    loadCountries();
    
    // Setup form handlers
    document.getElementById('countryFormElement').addEventListener('submit', addCountry);
    document.getElementById('cityFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const editId = this.dataset.editId;
        if (editId) {
            updateCity(parseInt(editId));
            delete this.dataset.editId;
        } else {
            addCity(e);
        }
    });
}

function updateCity(cityId) {
    const cities = getDeliveryCities();
    const index = cities.findIndex(c => c.id === cityId);
    
    if (index !== -1) {
        cities[index] = {
            ...cities[index],
            name_en: document.getElementById('cityNameEn').value,
            name_ar: document.getElementById('cityNameAr').value,
            displayed_fee: parseFloat(document.getElementById('cityDisplayedFee').value),
            actual_fee: parseFloat(document.getElementById('cityActualFee').value)
        };
        
        saveDeliveryCities(cities);
        loadCitiesForCountry();
        hideCityForm();
        alert('City updated successfully!');
    }
}
```

---

## 3. Enhanced Reports with Profit Calculation

### Update Order Details View:

```javascript
function viewOrderDetails(orderId) {
    const orders = getOrders();
    const order = orders.find(o => o.orderId === orderId);
    
    if (!order) return;
    
    const products = getProducts();
    let orderHTML = `
        <div class="order-details-modal">
            <h3>Order Details: ${order.orderId}</h3>
            
            <div class="order-info">
                <p><strong>Customer:</strong> ${order.customerName}</p>
                <p><strong>Phone:</strong> ${order.customerPhone}</p>
                <p><strong>City:</strong> ${order.deliveryCity}</p>
                <p><strong>Address:</strong> ${order.deliveryAddress}</p>
                <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
            </div>
            
            <h4>Order Items</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Cost Price</th>
                        <th>Sell Price</th>
                        <th>Subtotal</th>
                        <th>Profit</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    let totalCost = 0;
    let totalSelling = 0;
    
    order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const costPrice = product ? product.cost_price || 0 : 0;
        const itemCost = costPrice * item.quantity;
        const itemSelling = item.price * item.quantity;
        const itemProfit = itemSelling - itemCost;
        
        totalCost += itemCost;
        totalSelling += itemSelling;
        
        orderHTML += `
            <tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>$${costPrice.toFixed(2)}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${itemSelling.toFixed(2)}</td>
                <td style="color: ${itemProfit > 0 ? 'green' : 'red'};">
                    $${itemProfit.toFixed(2)}
                </td>
            </tr>
        `;
    });
    
    const deliveryFee = order.shippingCost || 0;
    const totalProfit = totalSelling - totalCost;
    const netRevenue = totalProfit - deliveryFee;
    
    orderHTML += `
                </tbody>
            </table>
            
            <div class="order-summary">
                <p><strong>Items Subtotal:</strong> $${totalSelling.toFixed(2)}</p>
                <p><strong>Total Cost:</strong> $${totalCost.toFixed(2)}</p>
                <p><strong>Gross Profit:</strong> <span style="color: green;">$${totalProfit.toFixed(2)}</span></p>
                <p><strong>Delivery Fee:</strong> $${deliveryFee.toFixed(2)}</p>
                <hr>
                <p style="font-size: 1.2em;"><strong>Net Revenue:</strong> 
                    <span style="color: ${netRevenue > 0 ? 'green' : 'red'}; font-weight: bold;">
                        $${netRevenue.toFixed(2)}
                    </span>
                </p>
                <p><strong>Order Total:</strong> $${order.total.toFixed(2)}</p>
            </div>
            
            <button onclick="closeOrderDetails()" class="btn-primary">Close</button>
        </div>
    `;
    
    // Display modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = orderHTML;
    modal.onclick = function(e) {
        if (e.target === modal) closeOrderDetails();
    };
    
    document.body.appendChild(modal);
}

function closeOrderDetails() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}
```

---

## 4. Initialize Everything on Page Load

### Add to Document Ready:

```javascript
// Add to existing DOMContentLoaded event listener

document.addEventListener('DOMContentLoaded', function() {
    // Existing initialization
    loadDashboard();
    loadProducts();
    loadCategories();
    loadOrders();
    
    // NEW: Initialize delivery management
    initDeliveryManagement();
    
    // Update product form handler
    document.getElementById('productFormElement').addEventListener('submit', saveProduct);
});
```

---

## 📋 Complete Implementation Checklist

### Add to admin.js:

- [ ] Update `saveProduct()` - include cost_price, quantity_to_sell
- [ ] Update `loadProducts()` - display new fields in table
- [ ] Update `editProduct()` - load new fields
- [ ] Add `getDeliveryCountries()`
- [ ] Add `getDeliveryCities()`
- [ ] Add `saveDeliveryCountries()`
- [ ] Add `saveDeliveryCities()`
- [ ] Add `showAddCountryForm()`
- [ ] Add `hideCountryForm()`
- [ ] Add `addCountry()`
- [ ] Add `loadCountries()`
- [ ] Add `toggleCountryStatus()`
- [ ] Add `deleteCountry()`
- [ ] Add `showAddCityForm()`
- [ ] Add `hideCityForm()`
- [ ] Add `addCity()`
- [ ] Add `loadCitiesForCountry()`
- [ ] Add `toggleCityStatus()`
- [ ] Add `deleteCity()`
- [ ] Add `editCity()`
- [ ] Add `updateCity()`
- [ ] Add `initDeliveryManagement()`
- [ ] Update `viewOrderDetails()` - show profit calculations
- [ ] Add initialization call in DOMContentLoaded

---

## 🎯 Testing Steps

After implementing:

1. **Test Product Management:**
   - Add product with cost price
   - Add product with quantity to sell
   - Verify both fields save
   - Edit product and verify fields load

2. **Test Delivery Management:**
   - Add a country with default fee
   - Add cities for that country
   - Add city with fee override
   - Toggle status (activate/deactivate)
   - Delete city, delete country

3. **Test Reports:**
   - Create order with products
   - View order details
   - Verify cost prices show
   - Verify profit calculations
   - Verify net revenue calculation

---

**All code above is ready to copy-paste into your admin.js file!**
