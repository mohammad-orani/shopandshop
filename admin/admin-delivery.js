/**
 * Admin Delivery Management — Database Connected
 * Uses getDeliveryCountries / getDeliveryCities from admin-api.js
 */

// ==================== LOAD COUNTRIES ====================

async function loadDeliverySection() {
    await loadDeliveryCountries();
}

async function loadDeliveryCountries() {
    const tbody = document.getElementById('countriesTableBody');
    const countrySelect = document.getElementById('deliveryCountrySelect');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;">Loading...</td></tr>';

    try {
        const countries = await getDeliveryCountries();

        if (countries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;">No countries yet.</td></tr>';
            return;
        }

        tbody.innerHTML = countries.map(c => `
            <tr>
                <td>${c.country_name_en}</td>
                <td>${c.country_name_ar}</td>
                <td>${c.phone_prefix || c.phonePrefix || '-'}</td>
                <td>${c.default_fee || 0}JD</td>
                <td>
                    <button class="btn-info" onclick="editCountryPrompt('${c.id}', '${c.country_name_en}', '${c.country_name_ar}', '${c.phone_prefix || c.phonePrefix || ''}', ${c.delivery_fee || c.defaultFee || 0})" style="margin-right:0.5rem;">Edit</button>
                    <button class="btn-danger" onclick="confirmDeleteCountry('${c.id}')">Delete</button>
                </td>
            </tr>`).join('');

        if (countrySelect) {
            countrySelect.innerHTML = '<option value="">-- Select Country --</option>' +
                countries.map(c => `<option value="${c.id}">${c.country_name_en} / ${c.country_name_ar}</option>`).join('');
        }

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:red;">Error: ${error.message}</td></tr>`;
    }
}

// ==================== LOAD CITIES ====================

async function loadCitiesForCountry() {
    const countryId = document.getElementById('deliveryCountrySelect')?.value;
    const tbody = document.getElementById('citiesTableBody');
    const addBtn = document.getElementById('addCityBtn');
    const container = document.getElementById('citiesTableContainer');

    if (!countryId) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;">Select a country first</td></tr>';
        if (addBtn) addBtn.disabled = true;
        if (container) container.style.display = 'none';
        return;
    }

    if (addBtn) addBtn.disabled = false;
    if (container) container.style.display = 'block';
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;">Loading...</td></tr>';

    try {
        const cities = await getDeliveryCities(countryId);

        if (!cities || cities.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#666;">No cities yet. Click "+ ADD CITY" to add one.</td></tr>';
            return;
        }

        tbody.innerHTML = cities.map(city => `
            <tr>
                <td>${city.city_name_en}</td>
                <td>${city.city_name_ar}</td>
                <td>${city.displayed_fee ?? city.delivery_fee ?? 0}JD</td>
                <td>${city.actual_fee ?? city.delivery_fee ?? 0}JD</td>
                <td>
                    <button class="btn-info" onclick="editCityPrompt('${city.id}', '${city.city_name_en}', '${city.city_name_ar}', ${city.displayed_fee ?? city.delivery_fee ?? 0}, ${city.actual_fee ?? city.delivery_fee ?? 0})" style="margin-right:0.5rem;">Edit</button>
                    <button class="btn-danger" onclick="confirmDeleteCity('${city.id}')">Delete</button>
                </td>
            </tr>`).join('');

    } catch (error) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:red;">Error: ${error.message}</td></tr>`;
    }
}

// ==================== COUNTRY FORMS ====================

function showAddCountryForm() {
    const form = document.getElementById('countryForm');
    if (form) {
        form.style.display = 'block';
        document.getElementById('countryFormElement')?.reset();
        const title = document.getElementById('countryFormTitle');
        if (title) title.textContent = 'Add New Country';
        const btn = document.querySelector('#countryFormElement button[type="submit"]');
        if (btn) btn.textContent = 'Add Country';
        // Clear edit id
        const editId = document.getElementById('editCountryId');
        if (editId) editId.value = '';
    }
}

function hideCountryForm() {
    const form = document.getElementById('countryForm');
    if (form) form.style.display = 'none';
}

async function editCountryPrompt(id, nameEn, nameAr, prefix, fee) {
    const form = document.getElementById('countryForm');
    if (!form) return;

    // Populate form
    const editId = document.getElementById('editCountryId');
    if (editId) editId.value = id;
    setVal('countryNameEn', nameEn);
    setVal('countryNameAr', nameAr);
    setVal('countryPhonePrefix', prefix);
    setVal('countryDefaultFee', fee);

    const title = document.getElementById('countryFormTitle');
    if (title) title.textContent = 'Edit Country';
    const btn = document.querySelector('#countryFormElement button[type="submit"]');
    if (btn) btn.textContent = 'Save Changes';

    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
}

if (document.getElementById('countryFormElement')) {
    document.getElementById('countryFormElement').addEventListener('submit', async function (e) {
        e.preventDefault();
        const editId = document.getElementById('editCountryId')?.value;

        const data = {
            name_en:      document.getElementById('countryNameEn')?.value,
            name_ar:      document.getElementById('countryNameAr')?.value,
            phone_prefix: document.getElementById('countryPhonePrefix')?.value || '',
            delivery_fee: parseFloat(document.getElementById('countryDefaultFee')?.value) || 0
        };

        try {
            const result = editId
                ? await updateCountry(editId, data)
                : await createCountry(data);

            if (result.error) { alert('❌ Error: ' + result.error); return; }
            showToast(editId ? '✅ Country updated!' : '✅ Country added!');
            hideCountryForm();
            loadDeliveryCountries();
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
    });
}

async function confirmDeleteCountry(id) {
    if (!confirm('Delete this country and all its cities?')) return;
    try {
        // Delete all cities first
        const cities = await getDeliveryCities(id);
        for (const city of cities) {
            await fetch(`${API_URL}/delivery/cities/${city.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
        }
        const result = await fetch(`${API_URL}/delivery/countries/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        }).then(r => r.json());

        if (result.error) { alert('Error: ' + result.error); return; }
        showToast('✅ Country deleted!');
        loadDeliveryCountries();
    } catch (err) { alert('Error: ' + err.message); }
}

// ==================== CITY FORMS ====================

function showAddCityForm() {
    const countryId = document.getElementById('deliveryCountrySelect')?.value;
    if (!countryId) { alert('Please select a country first'); return; }

    const form = document.getElementById('cityForm');
    if (!form) return;

    document.getElementById('cityFormElement')?.reset();
    const editId = document.getElementById('editCityId');
    if (editId) editId.value = '';
    setVal('cityCountryId', countryId);

    const title = document.getElementById('cityFormTitle');
    if (title) title.textContent = 'Add New City';
    const btn = document.querySelector('#cityFormElement button[type="submit"]');
    if (btn) btn.textContent = 'Add City';

    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
}

function hideCityForm() {
    const form = document.getElementById('cityForm');
    if (form) form.style.display = 'none';
}

async function editCityPrompt(id, nameEn, nameAr, displayedFee, actualFee) {
    const form = document.getElementById('cityForm');
    if (!form) return;

    const editId = document.getElementById('editCityId');
    if (editId) editId.value = id;
    setVal('cityNameEn', nameEn);
    setVal('cityNameAr', nameAr);
    setVal('cityDisplayedFee', displayedFee);
    setVal('cityActualFee', actualFee);
    setVal('cityCountryId', document.getElementById('deliveryCountrySelect')?.value || '');

    const title = document.getElementById('cityFormTitle');
    if (title) title.textContent = 'Edit City';
    const btn = document.querySelector('#cityFormElement button[type="submit"]');
    if (btn) btn.textContent = 'Save Changes';

    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
}

if (document.getElementById('cityFormElement')) {
    document.getElementById('cityFormElement').addEventListener('submit', async function (e) {
        e.preventDefault();
        const editId = document.getElementById('editCityId')?.value;
        const countryId = document.getElementById('cityCountryId')?.value;

        const data = {
            country_id:     countryId,
            name_en:        document.getElementById('cityNameEn')?.value,
            name_ar:        document.getElementById('cityNameAr')?.value,
            displayed_fee:  parseFloat(document.getElementById('cityDisplayedFee')?.value) || 0,
            actual_fee:     parseFloat(document.getElementById('cityActualFee')?.value) || 0,
            delivery_fee:   parseFloat(document.getElementById('cityDisplayedFee')?.value) || 0
        };

        try {
            const result = editId
                ? await updateCity(editId, data)
                : await createCity(data);

            if (result.error) { alert('❌ Error: ' + result.error); return; }
            showToast(editId ? '✅ City updated!' : '✅ City added!');
            hideCityForm();
            loadCitiesForCountry();
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
    });
}

async function confirmDeleteCity(id) {
    if (!confirm('Delete this city?')) return;
    try {
        const result = await fetch(`${API_URL}/delivery/cities/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        }).then(r => r.json());

        if (result.error) { alert('Error: ' + result.error); return; }
        showToast('✅ City deleted!');
        loadCitiesForCountry();
    } catch (err) { alert('Error: ' + err.message); }
}

// ==================== HELPERS ====================

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

// ==================== INIT ====================

if (typeof window !== 'undefined') {
    window.loadDeliverySection    = loadDeliverySection;
    window.loadDeliveryCountries  = loadDeliveryCountries;
    window.loadCitiesForCountry   = loadCitiesForCountry;
    window.showAddCountryForm     = showAddCountryForm;
    window.hideCountryForm        = hideCountryForm;
    window.showAddCityForm        = showAddCityForm;
    window.hideCityForm           = hideCityForm;
    window.confirmDeleteCountry   = confirmDeleteCountry;
    window.confirmDeleteCity      = confirmDeleteCity;
    window.editCountryPrompt      = editCountryPrompt;
    window.editCityPrompt         = editCityPrompt;
}