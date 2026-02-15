/**
 * Admin Delivery Management
 * Manages countries and cities from the new database system
 */

// Load all countries into the admin table
function loadDeliveryCountries() {
    const countries = getCountriesWithCities();
    const tbody = document.getElementById('countriesTableBody');
    const countrySelect = document.getElementById('deliveryCountrySelect');
    
    if (!tbody) {
        console.error('countriesTableBody not found');
        return;
    }
    
    console.log('Loading', countries.length, 'countries');
    
    // Update table
    tbody.innerHTML = countries.map(country => `
        <tr>
            <td>${country.name_en}</td>
            <td>${country.name_ar}</td>
            <td>$${country.defaultFee}</td>
            <td><span class="status-badge status-active">Active</span></td>
            <td>
                <button class="btn-sm btn-primary" onclick="editCountry(${country.id})" style="margin-right: 0.5rem;">Edit</button>
                <button class="btn-sm btn-danger" onclick="deleteCountry(${country.id})">Delete</button>
            </td>
        </tr>
    `).join('');
    
    // Update dropdown
    if (countrySelect) {
        countrySelect.innerHTML = '<option value="">-- Select Country --</option>' +
            countries.map(c => `<option value="${c.id}">${c.name_en} / ${c.name_ar}</option>`).join('');
    }
}

// Load cities for selected country
function loadCitiesForCountry() {
    const countryId = parseInt(document.getElementById('deliveryCountrySelect').value);
    const tbody = document.getElementById('citiesTableBody');
    const addBtn = document.getElementById('addCityBtn');
    const citiesContainer = document.getElementById('citiesTableContainer');
    
    if (!countryId || !tbody) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Select a country first</td></tr>';
        if (addBtn) addBtn.disabled = true;
        if (citiesContainer) citiesContainer.style.display = 'none';
        return;
    }
    
    if (addBtn) addBtn.disabled = false;
    if (citiesContainer) citiesContainer.style.display = 'block';
    
    const cities = getCitiesByCountry(countryId);
    
    if (cities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #666;">No cities added yet. Click "+ ADD CITY" to add one.</td></tr>';
        return;
    }
    
    tbody.innerHTML = cities.map(city => `
        <tr>
            <td>${city.name_en}</td>
            <td>${city.name_ar}</td>
            <td>$${city.fee || 0}</td>
            <td>$${city.fee || 0}</td>
            <td><span class="status-badge status-active">Active</span></td>
            <td>
                <button class="btn-sm btn-primary" onclick="editCity(${countryId}, ${city.id})" style="margin-right: 0.5rem;">Edit</button>
                <button class="btn-sm btn-danger" onclick="deleteCity(${countryId}, ${city.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Show add country form
function showAddCountryForm() {
    document.getElementById('countryForm').style.display = 'block';
    document.getElementById('countryFormElement').reset();
}

// Hide add country form
function hideCountryForm() {
    document.getElementById('countryForm').style.display = 'none';
}

// Show add city form
function showAddCityForm() {
    const countryId = document.getElementById('deliveryCountrySelect').value;
    if (!countryId) {
        alert('Please select a country first');
        return;
    }
    
    document.getElementById('cityCountryId').value = countryId;
    document.getElementById('cityForm').style.display = 'block';
    document.getElementById('cityFormElement').reset();
}

// Hide add city form
function hideCityForm() {
    document.getElementById('cityForm').style.display = 'none';
}

// Add new country
if (document.getElementById('countryFormElement')) {
    document.getElementById('countryFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const countries = getCountriesWithCities();
        const newId = Math.max(...countries.map(c => c.id), 0) + 1;
        
        const newCountry = {
            id: newId,
            name_en: document.getElementById('countryNameEn').value,
            name_ar: document.getElementById('countryNameAr').value,
            phonePrefix: document.getElementById('countryPhonePrefix') ? document.getElementById('countryPhonePrefix').value : '+962',
            defaultFee: parseFloat(document.getElementById('countryDefaultFee').value) || 0,
            cities: []
        };
        
        countries.push(newCountry);
        saveCountriesWithCities(countries);
        
        hideCountryForm();
        loadDeliveryCountries();
        alert('Country added successfully!');
    });
}

// Add new city
if (document.getElementById('cityFormElement')) {
    document.getElementById('cityFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const countryId = parseInt(document.getElementById('cityCountryId').value);
        const countries = getCountriesWithCities();
        const country = countries.find(c => c.id === countryId);
        
        if (!country) {
            alert('Country not found');
            return;
        }
        
        const newCityId = country.cities.length > 0 
            ? Math.max(...country.cities.map(c => c.id)) + 1 
            : 1;
        
        const newCity = {
            id: newCityId,
            name_en: document.getElementById('cityNameEn').value,
            name_ar: document.getElementById('cityNameAr').value,
            fee: parseFloat(document.getElementById('cityDisplayedFee').value) || 0
        };
        
        country.cities.push(newCity);
        saveCountriesWithCities(countries);
        
        hideCityForm();
        loadCitiesForCountry();
        alert('City added successfully!');
    });
}

// Delete country
function deleteCountry(countryId) {
    if (!confirm('Are you sure you want to delete this country and all its cities?')) return;
    
    let countries = getCountriesWithCities();
    countries = countries.filter(c => c.id !== countryId);
    saveCountriesWithCities(countries);
    
    loadDeliveryCountries();
    alert('Country deleted successfully!');
}

// Delete city
function deleteCity(countryId, cityId) {
    if (!confirm('Are you sure you want to delete this city?')) return;
    
    const countries = getCountriesWithCities();
    const country = countries.find(c => c.id === countryId);
    
    if (country) {
        country.cities = country.cities.filter(c => c.id !== cityId);
        saveCountriesWithCities(countries);
        loadCitiesForCountry();
        alert('City deleted successfully!');
    }
}

// Edit country (simple version)
function editCountry(countryId) {
    const countries = getCountriesWithCities();
    const country = countries.find(c => c.id === countryId);
    
    if (!country) return;
    
    const newNameEn = prompt('Country Name (English):', country.name_en);
    if (!newNameEn) return;
    
    const newNameAr = prompt('Country Name (Arabic):', country.name_ar);
    if (!newNameAr) return;
    
    const newFee = prompt('Default Delivery Fee ($):', country.defaultFee);
    if (newFee === null) return;
    
    country.name_en = newNameEn;
    country.name_ar = newNameAr;
    country.defaultFee = parseFloat(newFee) || 0;
    
    saveCountriesWithCities(countries);
    loadDeliveryCountries();
    alert('Country updated successfully!');
}

// Edit city (simple version)
function editCity(countryId, cityId) {
    const countries = getCountriesWithCities();
    const country = countries.find(c => c.id === countryId);
    if (!country) return;
    
    const city = country.cities.find(c => c.id === cityId);
    if (!city) return;
    
    const newNameEn = prompt('City Name (English):', city.name_en);
    if (!newNameEn) return;
    
    const newNameAr = prompt('City Name (Arabic):', city.name_ar);
    if (!newNameAr) return;
    
    const newFee = prompt('Delivery Fee ($):', city.fee);
    if (newFee === null) return;
    
    city.name_en = newNameEn;
    city.name_ar = newNameAr;
    city.fee = parseFloat(newFee) || 0;
    
    saveCountriesWithCities(countries);
    loadCitiesForCountry();
    alert('City updated successfully!');
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        if (document.getElementById('delivery')) {
            loadDeliveryCountries();
        }
    });
} else {
    if (document.getElementById('delivery')) {
        loadDeliveryCountries();
    }
}

// Export functions
if (typeof window !== 'undefined') {
    window.loadDeliveryCountries = loadDeliveryCountries;
    window.loadCitiesForCountry = loadCitiesForCountry;
    window.showAddCountryForm = showAddCountryForm;
    window.hideCountryForm = hideCountryForm;
    window.showAddCityForm = showAddCityForm;
    window.hideCityForm = hideCityForm;
    window.deleteCountry = deleteCountry;
    window.deleteCity = deleteCity;
    window.editCountry = editCountry;
    window.editCity = editCity;
}
