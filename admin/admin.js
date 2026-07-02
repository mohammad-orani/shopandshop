// ==================== ADMIN.JS - DATABASE CONNECTED ====================

const API_BASE = (typeof API_URL !== 'undefined' ? API_URL : 'https://primejo-ecommerce-backend-demo.up.railway.app/api');

// ==================== NAVIGATION ====================

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    const section = document.getElementById(sectionId);
    if (section) section.classList.add('active');

    const link = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (link) link.classList.add('active');

    const titles = {
        'dashboard':           'Dashboard',
        'products':            'Product Management',
        'categories':          'Category Management',
        'orders':              'Order Management',
        'delivery':            'Delivery Management',
        'reports':             'Reports & Export',
        'banners':             'Banner Management',
        'wa-contacts':         'WhatsApp Contacts',
        'wa-broadcast':        'WhatsApp Broadcast'
    };

    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titles[sectionId] || sectionId;

    if (sectionId === 'dashboard')            loadDashboard();
    if (sectionId === 'products')             loadProducts();
    if (sectionId === 'categories')           loadCategories();
    if (sectionId === 'orders')               loadOrders(_ordersFilter || '', _ordersPage || 1);
    if (sectionId === 'delivery')             loadDelivery();
    if (sectionId === 'reports')              loadReports();
    if (sectionId === 'banners')              loadBanners();
    if (sectionId === 'general-info-section') loadGeneralInfo();
    if (sectionId === 'logs')                 loadLogs();
    if (sectionId === 'wa-contacts')          loadWaContacts();
    if (sectionId === 'wa-broadcast')         loadWaBroadcastCount();
}

// ==================== DASHBOARD ====================

async function loadDashboard() {
    try {
        showLoading('recentOrdersList', 'Loading dashboard...');

        // Stats come from a dedicated SQL COUNT/SUM endpoint — accurate regardless of order volume
        // Recent orders list uses the default paginated fetch (returns latest 100, we show 5)
        const [stats, recentData] = await Promise.all([
            getStats(),
            getOrdersPaginated({ limit: 5 })
        ]);

        setEl('totalProducts', stats.total_products ?? '—');
        setEl('totalOrders',   stats.total_orders   ?? '—');
        setEl('pendingOrders', stats.pending_orders  ?? '—');
        setEl('totalRevenue',  `${parseFloat(stats.total_revenue || 0).toFixed(2)}JD`);

        const recentOrders = recentData.orders || [];
        const recentHTML = recentOrders.map(order => {
            const id     = order.order_id || order.orderId;
            const name   = order.customer_name || order.customerName;
            const status = order.order_status || order.status;
            return `
                <div class="order-item">
                    <div>
                        <strong>${id}</strong><br>
                        ${name}
                    </div>
                    <div>
                        <strong>${parseFloat(order.total || 0).toFixed(2)}JD</strong><br>
                        <span class="status-badge status-${status}">${status}</span>
                    </div>
                </div>`;
        }).join('');

        setEl('recentOrdersList', recentHTML || '<p>No orders yet</p>');

    } catch (error) {
        console.error('Dashboard error:', error);
        setEl('recentOrdersList', '<p style="color:red">Error loading dashboard</p>');
    }
}

// ==================== PRODUCTS ====================

async function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    try {
        showLoading('productsTableBody', 'Loading products...', 8);
        const products = await getProducts();

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;">No products found.</td></tr>';
            return;
        }

        // Store all products for search
        window._allProducts = products;
        renderProductsTable(products);
        await loadCategoryOptions();

    } catch (error) {
        console.error('Load products error:', error);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:red;">Error: ${error.message}</td></tr>`;
    }
}

function renderProductsTable(products) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;">No products found.</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.id}</td>
                <td><img src="${p.image || p.image_url || ''}" class="product-img" alt="${p.name_en}"
                         onerror="this.src='https://placehold.co/60x60?text=No+Img'"
                         style="width:60px;height:60px;object-fit:cover;"></td>
                <td>${p.name_en}</td>
                <td>${p.category || p.category_id || '-'}</td>
                <td>${parseFloat(p.newPrice || p.new_price || 0).toFixed(2)}JD</td>
                <td>${p.stock || 0}</td>
                <td><span class="status-badge status-${(p.visible !== false && p.is_visible !== false) ? 'visible' : 'hidden'}">
                    ${(p.visible !== false && p.is_visible !== false) ? 'Visible' : 'Hidden'}</span></td>
                <td>
                    <button class="btn-info" onclick="editProduct(${p.id})">Edit</button>
                    <button class="btn-danger" onclick="confirmDeleteProduct(${p.id})">Delete</button>
                </td>
            </tr>`).join('');

}

async function loadCategoryOptions() {
    const select = document.getElementById('productCategory');
    if (!select) return;
    try {
        const categories = await getCategories();
        select.innerHTML = '<option value="">-- Select Category --</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.name_en}</option>`).join('');
    } catch (e) { console.error('Load category options error:', e); }
}

function searchProducts() {
    const query = document.getElementById('productSearch')?.value?.toLowerCase() || '';
    const all = window._allProducts || [];
    const filtered = all.filter(p =>
        (p.name_en || '').toLowerCase().includes(query) ||
        (p.name_ar || '').toLowerCase().includes(query) ||
        String(p.id).includes(query)
    );
    renderProductsTable(filtered);
}

function showAddProductForm() {
    const form = document.getElementById('productForm');
    if (!form) return;
    form.style.display = 'block';
    setEl('formTitle', 'Add New Product');
    document.getElementById('productFormElement')?.reset();
    const idEl = document.getElementById('productId');
    if (idEl) idEl.value = '';
    renderTierRows([]);
    renderColorRows([]);
    loadCategoryOptions();
    form.scrollIntoView({ behavior: 'smooth' });
}

function hideProductForm() {
    const form = document.getElementById('productForm');
    if (form) form.style.display = 'none';
    const preview = document.getElementById('mediaPreview');
    if (preview) preview.style.display = 'none';
}

async function editProduct(id) {
    try {
        const products = await getProducts();
        const p = products.find(p => String(p.id) === String(id));
        if (!p) { alert('Product not found'); return; }

        const form = document.getElementById('productForm');
        if (!form) return;
        form.style.display = 'block';
        setEl('formTitle', 'Edit Product');

        setVal('productId', p.id);
        setVal('productNameEn', p.name_en || '');
        setVal('productNameAr', p.name_ar || '');
        setVal('productDescEn', p.description_en || '');
        setVal('productDescAr', p.description_ar || '');
        setVal('productStock', p.stock || 0);
        setVal('productQuantityToSell', p.quantity_to_sell || p.quantityToSell || p.stock || 0);
        setVal('productCostPrice', p.cost_price || p.costPrice || 0);
        setVal('productOldPrice', p.old_price || p.oldPrice || 0);
        setVal('productNewPrice', p.new_price || p.newPrice || 0);
        setVal('productImage', p.image_url || p.image || '');

        let additionalImagesStr = '';
        if (p.additional_images) {
            try {
                const imgs = typeof p.additional_images === 'string'
                    ? JSON.parse(p.additional_images) : p.additional_images;
                additionalImagesStr = Array.isArray(imgs) ? imgs.join(', ') : '';
            } catch (e) { additionalImagesStr = p.additional_images; }
        }
        setVal('productAdditionalImages', additionalImagesStr);
        setVal('productVideo', p.video_url || p.videoUrl || '');
        setChecked('productNew', p.isNew || p.is_new || false);
        setChecked('productTopSeller', p.topSeller || p.is_top_seller || false);
        setChecked('productOffer', p.isOffer || p.is_offer || false);
        setChecked('productFreeDelivery', !!(p.is_free_delivery));
        setChecked('productVisible', p.visible !== false && p.is_visible !== false);

        // Load quantity tiers
        let tiers = [];
        if (p.quantity_tiers) {
            try {
                tiers = typeof p.quantity_tiers === 'string' ? JSON.parse(p.quantity_tiers) : p.quantity_tiers;
            } catch (e) { tiers = []; }
        }
        renderTierRows(Array.isArray(tiers) ? tiers : []);

        // Load color variants
        let colors = [];
        if (p.color_variants) {
            try {
                colors = typeof p.color_variants === 'string' ? JSON.parse(p.color_variants) : p.color_variants;
            } catch (e) { colors = []; }
        }
        renderColorRows(Array.isArray(colors) ? colors : []);

        await loadCategoryOptions();
        setVal('productCategory', p.category || p.category_id || '');
        form.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Edit product error:', error);
        alert('Error loading product: ' + error.message);
    }
}

async function confirmDeleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
        const result = await deleteProduct(id);
        if (result.error) { alert('Error: ' + result.error); return; }
        showToast('✅ Product deleted successfully!');
        loadProducts();
    } catch (error) {
        alert('Error deleting product: ' + error.message);
    }
}

document.getElementById('productFormElement')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn?.textContent;
    if (submitBtn) { submitBtn.textContent = 'Saving...'; submitBtn.disabled = true; }

    try {
        const productId = document.getElementById('productId')?.value;
        const additionalImagesText = document.getElementById('productAdditionalImages')?.value || '';
        const additionalImages = additionalImagesText.split(',').map(u => u.trim()).filter(u => u);

        const productData = {
            name_en: document.getElementById('productNameEn')?.value || '',
            name_ar: document.getElementById('productNameAr')?.value || '',
            description_en: document.getElementById('productDescEn')?.value || '',
            description_ar: document.getElementById('productDescAr')?.value || '',
            category_id: document.getElementById('productCategory')?.value || '',
            stock: parseInt(document.getElementById('productStock')?.value || 0),
            quantity_to_sell: parseInt(document.getElementById('productQuantityToSell')?.value || 0),
            cost_price: parseFloat(document.getElementById('productCostPrice')?.value || 0),
            old_price: parseFloat(document.getElementById('productOldPrice')?.value || 0),
            new_price: parseFloat(document.getElementById('productNewPrice')?.value || 0),
            image_url: document.getElementById('productImage')?.value || '',
            additional_images: JSON.stringify(additionalImages),
            video_url: document.getElementById('productVideo')?.value || '',
            is_new: document.getElementById('productNew')?.checked || false,
            is_top_seller: document.getElementById('productTopSeller')?.checked || false,
            is_offer: document.getElementById('productOffer')?.checked || false,
            is_free_delivery: document.getElementById('productFreeDelivery')?.checked || false,
            is_visible: document.getElementById('productVisible')?.checked !== false,
            quantity_tiers: (() => {
                const tiers = collectTiers();
                return tiers.length > 0 ? JSON.stringify(tiers) : null;
            })(),
            color_variants: (() => {
                const colors = collectColors();
                return colors.length > 0 ? JSON.stringify(colors) : null;
            })(),
        };

        const result = productId ? await updateProduct(productId, productData) : await createProduct(productData);
        if (result.error) { alert('❌ Error: ' + result.error); return; }

        showToast('✅ Product saved successfully!');
        hideProductForm();
        loadProducts();
    } catch (error) {
        alert('❌ Error saving product: ' + error.message);
    } finally {
        if (submitBtn) { submitBtn.textContent = originalText; submitBtn.disabled = false; }
    }
});

// ==================== QUANTITY TIERS ====================

function renderTierRows(tiers) {
    const container = document.getElementById('tiersContainer');
    if (!container) return;
    container.innerHTML = '';
    (tiers || []).forEach(tier => addTierRow(tier.qty, tier.price));
}

function addTierRow(qty = '', price = '') {
    const container = document.getElementById('tiersContainer');
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'tier-row';
    row.style.cssText = 'display:flex;gap:0.75rem;align-items:center;margin-bottom:0.5rem;';
    row.innerHTML = `
        <input type="number" placeholder="Qty" min="1" value="${qty}"
               style="width:90px;" class="tier-qty-input">
        <span style="font-weight:600;">pcs →</span>
        <input type="number" placeholder="Price (JD)" min="0" step="0.01" value="${price}"
               style="width:110px;" class="tier-price-input">
        <span style="font-weight:600;">JOD</span>
        <button type="button" onclick="this.parentElement.remove()"
                style="background:#e74c3c;color:#fff;border:none;padding:0.25rem 0.6rem;cursor:pointer;border-radius:4px;">✕</button>
    `;
    container.appendChild(row);
}

function collectTiers() {
    const rows = document.querySelectorAll('#tiersContainer .tier-row');
    const tiers = [];
    rows.forEach(row => {
        const qty = parseInt(row.querySelector('.tier-qty-input')?.value);
        const price = parseFloat(row.querySelector('.tier-price-input')?.value);
        if (!isNaN(qty) && qty > 0 && !isNaN(price) && price >= 0) {
            tiers.push({ qty, price });
        }
    });
    return tiers;
}

// ==================== COLOR VARIANTS ====================

function renderColorRows(colors) {
    const container = document.getElementById('colorsContainer');
    if (!container) return;
    container.innerHTML = '';
    (colors || []).forEach(c => addColorRow(c.name, c.name_ar || '', c.image || '', c.hex || ''));
}

function addColorRow(name = '', nameAr = '', image = '', hex = '') {
    const container = document.getElementById('colorsContainer');
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'color-row';
    row.style.cssText = 'display:flex;gap:0.5rem;align-items:center;margin-bottom:0.5rem;flex-wrap:wrap;background:#f9f9f9;padding:0.5rem;border-radius:6px;border:1px solid #eee;';
    row.innerHTML = `
        <input type="text" placeholder="Name EN (e.g. Black)" value="${name}"
               style="width:120px;" class="color-name-input">
        <input type="text" placeholder="اسم اللون (AR)" value="${nameAr}"
               style="width:120px;" class="color-name-ar-input">
        <input type="text" placeholder="Image URL for this color" value="${image}"
               style="flex:1;min-width:200px;" class="color-image-input">
        <input type="color" value="${hex || '#cccccc'}" title="Swatch color (optional)"
               style="width:36px;height:32px;padding:2px;cursor:pointer;border:1px solid #ccc;border-radius:4px;" class="color-hex-input">
        <button type="button" onclick="this.parentElement.remove()"
                style="background:#e74c3c;color:#fff;border:none;padding:0.3rem 0.7rem;cursor:pointer;border-radius:4px;">✕</button>
    `;
    container.appendChild(row);
}

function collectColors() {
    const rows = document.querySelectorAll('#colorsContainer .color-row');
    const colors = [];
    rows.forEach(row => {
        const name   = row.querySelector('.color-name-input')?.value?.trim();
        const nameAr = row.querySelector('.color-name-ar-input')?.value?.trim() || '';
        const image  = row.querySelector('.color-image-input')?.value?.trim() || '';
        const hex    = row.querySelector('.color-hex-input')?.value?.trim() || '';
        if (name) colors.push({ name, name_ar: nameAr, image, hex });
    });
    return colors;
}

// ==================== MEDIA PREVIEW ====================

function previewMainImage() {
    const url = document.getElementById('productImage')?.value;
    if (!url) { alert('Enter an image URL first'); return; }
    showPreview(`<img src="${url}" style="max-width:400px;max-height:400px;border:2px solid #000;"
                      onerror="this.nextElementSibling.style.display='block';this.style.display='none';">
                 <div style="display:none;padding:1rem;background:#ffebee;color:#c62828;">⚠️ Failed to load image</div>`);
}

function previewAdditionalImages() {
    const text = document.getElementById('productAdditionalImages')?.value || '';
    const urls = text.split(',').map(u => u.trim()).filter(u => u);
    if (!urls.length) { alert('Enter image URLs first'); return; }
    const html = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem;">
        ${urls.map((url, i) => `
            <div style="border:2px solid #000;padding:0.5rem;">
                <div style="font-weight:600;margin-bottom:0.5rem;">Image ${i + 1}</div>
                <img src="${url}" style="width:100%;height:160px;object-fit:cover;" onerror="this.style.display='none'">
            </div>`).join('')}
    </div>`;
    showPreview(html);
}

function previewVideo() {
    const url = document.getElementById('productVideo')?.value;
    if (!url) { alert('Enter a video URL first'); return; }
    let html = '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const id = url.includes('watch?v=') ? url.split('v=')[1]?.split('&')[0] : url.split('youtu.be/')[1]?.split('?')[0];
        html = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>`;
    } else {
        html = `<video width="560" height="315" controls><source src="${url}">Video not supported.</video>`;
    }
    showPreview(html);
}

function showPreview(content) {
    const container = document.getElementById('mediaPreview');
    const inner = document.getElementById('previewContent');
    if (container && inner) { inner.innerHTML = content; container.style.display = 'block'; }
}

// ==================== CATEGORIES ====================

async function loadCategories() {
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) return;
    try {
        showLoading('categoriesTableBody', 'Loading categories...', 4);
        const categories = await getCategories();
        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;">No categories yet.</td></tr>';
            return;
        }
        tbody.innerHTML = categories.map(cat => `
            <tr>
                <td>${cat.id}</td>
                <td>${cat.name_en}</td>
                <td>${cat.name_ar}</td>
                <td><span class="status-badge status-${cat.is_visible != 0 ? 'visible' : 'hidden'}">
                    ${cat.is_visible != 0 ? 'Visible' : 'Hidden'}</span></td>
                <td>
                    <button class="btn-info" onclick="editCategory(${cat.id}, '${cat.name_en}', '${cat.name_ar}', ${cat.is_visible != 0})">Edit</button>
                    <button class="btn-danger" onclick="confirmDeleteCategory('${cat.id}')">Delete</button>
                </td>
            </tr>`).join('');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:red;">Error: ${error.message}</td></tr>`;
    }
}

function showAddCategoryForm() {
    const form = document.getElementById('categoryForm');
    if (!form) return;
    // Reset to "add" mode
    document.getElementById('categoryFormElement')?.reset();
    setVal('categoryId', '');
    setVal('editCategoryId', '');
    const title = document.getElementById('categoryFormTitle');
    if (title) title.textContent = 'Add New Category';
    const btn = document.querySelector('#categoryFormElement button[type="submit"]');
    if (btn) btn.textContent = 'Add Category';
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
}

function editCategory(id, nameEn, nameAr, isVisible) {
    const form = document.getElementById('categoryForm');
    if (!form) return;
    setVal('categoryId', id);
    setVal('editCategoryId', id);
    setVal('categoryNameEn', nameEn);
    setVal('categoryNameAr', nameAr);
    setChecked('categoryVisible', isVisible !== false);
    const title = document.getElementById('categoryFormTitle');
    if (title) title.textContent = 'Edit Category';
    const btn = document.querySelector('#categoryFormElement button[type="submit"]');
    if (btn) btn.textContent = 'Save Changes';
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
}

function hideCategoryForm() {
    const form = document.getElementById('categoryForm');
    if (form) form.style.display = 'none';
    document.getElementById('categoryFormElement')?.reset();
}

async function confirmDeleteCategory(id) {
    if (!confirm('Are you sure? Products in this category may be affected.')) return;
    try {
        const result = await deleteCategory(id);
        if (result.error) { alert('Error: ' + result.error); return; }
        showToast('✅ Category deleted!');
        loadCategories();
    } catch (error) { alert('Error: ' + error.message); }
}

document.getElementById('categoryFormElement')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const editId = document.getElementById('editCategoryId')?.value;
    try {
        const categoryData = {
            name_en: document.getElementById('categoryNameEn')?.value,
            name_ar: document.getElementById('categoryNameAr')?.value,
            is_visible: document.getElementById('categoryVisible')?.checked ? 1 : 0
        };

        let result;
        if (editId) {
            // Edit existing category
            result = await updateCategory(editId, categoryData);
            if (result.error) { alert('❌ Error: ' + result.error); return; }
            showToast('✅ Category updated!');
        } else {
            // Add new category
            categoryData.id = document.getElementById('categoryId')?.value;
            result = await createCategory(categoryData);
            if (result.error) { alert('❌ Error: ' + result.error); return; }
            showToast('✅ Category added!');
        }
        hideCategoryForm();
        loadCategories();
    } catch (error) { alert('❌ Error: ' + error.message); }
});

// ==================== ORDERS ====================

let _ordersPage       = 1;
let _ordersPageSize   = 20;
let _ordersFilter     = '';
let _ordersTotalCount = 0;

async function loadOrders(filterStatus = '', page = 1) {
    _ordersFilter = filterStatus;
    _ordersPage   = page;

    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    // Render filter bar once
    const filterBar = document.getElementById('ordersFilterBar');
    if (filterBar && !filterBar.dataset.built) {
        filterBar.dataset.built = '1';
        filterBar.innerHTML = `
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1.2rem;align-items:center;">
                <span style="font-weight:700;font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;">Filter:</span>
                ${['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map(s => `
                    <button onclick="loadOrders('${s}', 1)"
                            id="filterBtn_${s || 'all'}"
                            style="padding:6px 16px;border:2px solid #e0e0e0;background:#fff;
                                   font-size:0.82rem;font-weight:600;cursor:pointer;border-radius:3px;
                                   text-transform:capitalize;transition:all 0.15s;">
                        ${s || 'All'}
                    </button>`).join('')}
            </div>`;
    }

    // Highlight active filter button
    ['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].forEach(s => {
        const btn = document.getElementById('filterBtn_' + (s || 'all'));
        if (btn) {
            const isActive = s === filterStatus;
            btn.style.background   = isActive ? '#1a1a1a' : '#fff';
            btn.style.color        = isActive ? '#fff'    : '#1a1a1a';
            btn.style.borderColor  = isActive ? '#1a1a1a' : '#e0e0e0';
        }
    });

    try {
        showLoading('ordersTableBody', 'Loading orders...', 8);

        const filters = { limit: _ordersPageSize, offset: (page - 1) * _ordersPageSize };
        if (filterStatus) filters.status = filterStatus;

        const { total, orders } = await getOrdersPaginated(filters);
        _ordersTotalCount = total;

        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:#888;">
                ${filterStatus ? `No ${filterStatus} orders found` : 'No orders yet'}
            </td></tr>`;
            renderOrdersPagination();
            return;
        }

        // Store orders map for edit/view button lookup
        window._ordersMap = {};
        orders.forEach(o => { window._ordersMap[o.order_id || o.orderId] = o; });

        tbody.innerHTML = orders.map(order => {
            const id     = order.order_id || order.orderId;
            const name   = order.customer_name || order.customerName;
            const phone  = order.customer_phone || order.customerPhone;
            const status = order.order_status || order.status;
            const total  = parseFloat(order.total || 0);
            const date   = new Date(order.created_at || order.orderDate).toLocaleDateString();

            return `
            <tr>
                <td>${id}</td>
                <td>${name}</td>
                <td>${phone}</td>
                <td>${order.items?.length || '?'} items</td>
                <td>${total.toFixed(2)}JD</td>
                <td>${date}</td>
                <td><span class="status-badge status-${status}">${status}</span></td>
                <td style="white-space:nowrap;">
                    <button class="btn-info" onclick="viewOrderDetails('${id}')">👁 View</button>
                    <button class="btn-warning" onclick="openEditOrderModal(window._ordersMap['${id}'])">✏️ Edit</button>
                    <select onchange="changeOrderStatus('${id}', this.value)"
                        style="margin-top:4px;padding:5px 8px;border:1.5px solid #e0e0e0;border-radius:5px;
                               font-size:0.78rem;font-weight:600;cursor:pointer;background:#fff;display:block;width:100%;">
                        <option value="">Change Status</option>
                        <option value="pending"    ${status === 'pending'    ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped"    ${status === 'shipped'    ? 'selected' : ''}>Shipped</option>
                        <option value="delivered"  ${status === 'delivered'  ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled"  ${status === 'cancelled'  ? 'selected' : ''}>Cancelled</option>
                        <option value="refunded"   ${status === 'refunded'   ? 'selected' : ''}>Refunded</option>
                    </select>
                </td>
            </tr>`;
        }).join('');

        renderOrdersPagination();

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="8" style="color:red;text-align:center;">Error: ${error.message}</td></tr>`;
    }
}

function renderOrdersPagination() {
    const el = document.getElementById('ordersPagination');
    if (!el) return;

    const totalPages = Math.ceil(_ordersTotalCount / _ordersPageSize);
    const start      = (_ordersPage - 1) * _ordersPageSize + 1;
    const end        = Math.min(_ordersPage * _ordersPageSize, _ordersTotalCount);

    if (totalPages <= 1) { el.innerHTML = ''; return; }

    const btnStyle = (disabled) =>
        `padding:6px 14px;border:1.5px solid #e0e0e0;background:#fff;font-size:0.82rem;font-weight:700;
         border-radius:4px;cursor:${disabled ? 'default' : 'pointer'};color:${disabled ? '#ccc' : '#1a1a1a'};
         transition:all 0.15s;`;

    // Build page number buttons (show up to 5 around current page)
    const pageNums = [];
    const delta = 2;
    for (let p = Math.max(1, _ordersPage - delta); p <= Math.min(totalPages, _ordersPage + delta); p++) {
        pageNums.push(p);
    }

    el.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;justify-content:center;padding:1rem 0;flex-wrap:wrap;">
            <button style="${btnStyle(_ordersPage === 1)}"
                    onclick="loadOrders('${_ordersFilter}', 1)"
                    ${_ordersPage === 1 ? 'disabled' : ''}>«</button>
            <button style="${btnStyle(_ordersPage === 1)}"
                    onclick="loadOrders('${_ordersFilter}', ${_ordersPage - 1})"
                    ${_ordersPage === 1 ? 'disabled' : ''}">‹ Prev</button>

            ${pageNums.map(p => `
                <button onclick="loadOrders('${_ordersFilter}', ${p})"
                        style="${btnStyle(false)}${p === _ordersPage ? 'background:#1a1a1a;color:#fff;border-color:#1a1a1a;' : ''}">
                    ${p}
                </button>`).join('')}

            <button style="${btnStyle(_ordersPage === totalPages)}"
                    onclick="loadOrders('${_ordersFilter}', ${_ordersPage + 1})"
                    ${_ordersPage === totalPages ? 'disabled' : ''}>Next ›</button>
            <button style="${btnStyle(_ordersPage === totalPages)}"
                    onclick="loadOrders('${_ordersFilter}', ${totalPages})"
                    ${_ordersPage === totalPages ? 'disabled' : ''}>»</button>

            <span style="font-size:0.82rem;color:#888;margin-left:8px;">
                ${start}–${end} of ${_ordersTotalCount} orders
            </span>
        </div>`;
}

async function changeOrderStatus(orderId, newStatus) {
    if (!newStatus) return;

    // Intercept cancel and refund — require a reason first
    if (newStatus === 'cancelled') {
        openCancelModal(orderId);
        return;
    }
    if (newStatus === 'refunded') {
        openRefundModal(orderId);
        return;
    }

    try {
        const result = await updateOrderStatus(orderId, newStatus);
        if (result.error) { alert('Error: ' + result.error); return; }
        showToast('✅ Order status updated!');
        loadOrders(_ordersFilter, _ordersPage);
        loadDashboard();
    } catch (error) { alert('Error: ' + error.message); }
}

async function viewOrderDetails(orderId) {
    try {
        // Fetch order directly from API (includes full item list with IDs)
        let order = null;
        try {
            const res = await fetch(`${API_BASE}/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${getAdminToken()}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.order_id) order = data;
            }
        } catch (e) { /* fallback below */ }

        // Fallback: search in the current page's already-loaded orders map
        if (!order) {
            order = window._ordersMap?.[orderId] || null;
        }

        if (!order) { alert('Order not found'); return; }

        const status = order.order_status || order.status;
        const name = order.customer_name || order.customerName;
        const phone = order.customer_phone || order.customerPhone;
        const city = order.delivery_city || '';
        const country = order.delivery_country || '';
        const address = order.delivery_address || order.complete_address || order.deliveryAddress || '';
        const notes = order.order_notes || order.orderNotes || '';
        const payment = order.payment_method || order.paymentMethod || 'N/A';
        const total = parseFloat(order.total || 0);
        const displayedShipping = parseFloat(order.displayed_shipping_cost || order.delivery_fee || 0);
        const subtotal = parseFloat(order.subtotal || 0);
        const date = new Date(order.created_at || order.orderDate).toLocaleString();

        // Build items HTML
        let itemsHTML = '';
        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
            const rows = order.items.map(item => {
                const nameAr = item.productNameAr || item.product_name_ar || '';
                const nameEn = item.productName || item.product_name || '';
                const nameDisplay = nameAr
                    ? `<span style="font-weight:600;line-height:1.3;direction:rtl;unicode-bidi:embed;">${nameAr}</span>`
                    + (nameEn ? `<br><span style="font-size:0.82em;color:#888;">${nameEn}</span>` : '')
                    : `<span style="font-weight:500;line-height:1.3;">${nameEn || '—'}</span>`;
                const qty = item.quantity || 0;
                const price = parseFloat(item.price || 0).toFixed(2);
                const total = parseFloat(item.total || 0).toFixed(2);
                const img = item.image_url || '';
                const variant = item.selected_variant || item.selectedColor || '';
                const variantBadge = variant
                    ? `<span style="display:inline-block;margin-top:4px;background:#f0f4ff;color:#2d5c8f;border:1px solid #c5d5f0;border-radius:12px;padding:2px 10px;font-size:0.75rem;font-weight:600;">🎨 ${variant}</span>`
                    : '';
                return `
                    <tr style="border-bottom:1px solid #f0f0f0;">
                        <td style="padding:10px 12px;">
                            <div style="display:flex;align-items:center;gap:10px;">
                                ${img ? `<img src="${img}" style="width:44px;height:44px;object-fit:cover;border-radius:4px;border:1px solid #e8e8e8;flex-shrink:0;" onerror="this.style.display='none'">` : ''}
                                <div>${nameDisplay}${variantBadge ? '<br>' + variantBadge : ''}</div>
                            </div>
                        </td>
                        <td style="padding:10px 12px;text-align:center;color:#555;">${qty}</td>
                        <td style="padding:10px 12px;text-align:right;color:#555;">${price}JD</td>
                        <td style="padding:10px 12px;text-align:right;font-weight:700;color:#1a1a1a;">${total}JD</td>
                    </tr>`;
            }).join('');

            itemsHTML = `
                <div style="margin-bottom:1.2rem;">
                    <h4 style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;
                                color:#fff;background:#1a1a1a;padding:8px 12px;margin:0;border-radius:4px 4px 0 0;">
                        🛍️ Order Items (${order.items.length})
                    </h4>
                    <table style="width:100%;border-collapse:collapse;font-size:0.9rem;border:1.5px solid #e8e8e8;border-top:none;border-radius:0 0 4px 4px;overflow:hidden;">
                        <thead>
                            <tr style="background:#f8f8f8;border-bottom:1.5px solid #e8e8e8;">
                                <th style="text-align:left;padding:8px 12px;font-weight:600;font-size:0.8rem;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Product</th>
                                <th style="text-align:center;padding:8px 12px;font-weight:600;font-size:0.8rem;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
                                <th style="text-align:right;padding:8px 12px;font-weight:600;font-size:0.8rem;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Price</th>
                                <th style="text-align:right;padding:8px 12px;font-weight:600;font-size:0.8rem;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>`;
        } else {
            itemsHTML = `
                <div style="padding:1rem;background:#fff8e1;border:1.5px solid #f0c040;border-radius:4px;
                            color:#856404;font-size:0.88rem;margin-bottom:1.2rem;text-align:center;">
                    ⚠️ This order was placed before item tracking was enabled — no item details stored.
                </div>`;
        }

        document.getElementById('orderDetailsContent').innerHTML = `
            <div style="font-size:0.9rem;">
                <!-- Header info -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:1.2rem;padding-bottom:1rem;border-bottom:1px solid #e8e8e8;">
                    <div><span style="color:#888;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.5px;">Order ID</span><br>
                        <strong style="font-family:monospace;">${order.order_id || order.orderId}</strong></div>
                    <div><span style="color:#888;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.5px;">Date</span><br>
                        <strong>${date}</strong></div>
                    <div><span style="color:#888;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.5px;">Status</span><br>
                        <span class="status-badge status-${status}">${status}</span></div>
                    <div><span style="color:#888;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.5px;">Payment</span><br>
                        <strong>${payment}</strong></div>
                </div>

                <!-- Customer info -->
                <div style="margin-bottom:1.2rem;padding-bottom:1rem;border-bottom:1px solid #e8e8e8;">
                    <h4 style="font-family:'Playfair Display',serif;font-size:1rem;margin-bottom:0.6rem;">👤 Customer</h4>
                    <div><strong>Name:</strong> ${name}</div>
                    <div><strong>Phone:</strong> ${phone}</div>
                    <div><strong>Location:</strong> ${city}${city && country ? ', ' : ''}${country}</div>
                    ${address ? `<div><strong>Address:</strong> ${address}</div>` : ''}
                    ${notes ? `<div><strong>Notes:</strong> <em>${notes}</em></div>` : ''}
                </div>

                <!-- Order items table -->
                ${itemsHTML}

                <!-- Totals -->
                <div style="border-top:2px solid #1a1a1a;padding-top:0.8rem;">
                    ${subtotal > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:0.3rem;color:#666;">
                        <span>Subtotal</span><span>${subtotal.toFixed(2)}JD</span></div>` : ''}
                    ${displayedShipping > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:0.3rem;color:#666;">
                        <span>Shipping</span><span>${displayedShipping.toFixed(2)}JD</span></div>` : ''}
                    <div style="display:flex;justify-content:space-between;font-size:1.3rem;font-weight:900;margin-top:0.4rem;">
                        <span>Total</span>
                        <span style="color:#1a1a1a;">${total.toFixed(2)}JD</span>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('orderModal')?.classList.add('show');

    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function closeOrderModal() {
    document.getElementById('orderModal')?.classList.remove('show');
}

function printOrderModal() {
    const content = document.getElementById('orderDetailsContent')?.innerHTML;
    if (!content) return;

    const win = window.open('', '_blank', 'width=800,height=700');
    const printDate = new Date().toLocaleString();
    win.document.write(
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Order - Primejo</title><style>' +
        '* { margin:0; padding:0; box-sizing:border-box; }' +
        'body { font-family: Segoe UI, Arial, sans-serif; font-size:13px; color:#1a1a1a; padding:30px; }' +
        'h1 { font-size:22px; font-weight:900; margin-bottom:20px; padding-bottom:10px; border-bottom:2px solid #1a1a1a; }' +
        '.status-badge { display:inline-block; padding:3px 10px; border-radius:3px; font-size:11px; font-weight:700; text-transform:uppercase; }' +
        '.status-pending    { background:#fff3cd; color:#856404; }' +
        '.status-processing { background:#cce5ff; color:#004085; }' +
        '.status-shipped    { background:#d4edda; color:#155724; }' +
        '.status-delivered  { background:#d4edda; color:#155724; }' +
        '.status-cancelled  { background:#f8d7da; color:#721c24; }' +
        'table { width:100%; border-collapse:collapse; margin:10px 0; }' +
        'th { background:#1a1a1a; color:#fff; padding:8px 12px; text-align:left; font-size:11px; text-transform:uppercase; }' +
        'td { padding:10px 12px; border-bottom:1px solid #f0f0f0; }' +
        'img { width:44px; height:44px; object-fit:cover; border-radius:3px; }' +
        '.footer { margin-top:30px; text-align:center; font-size:11px; color:#aaa; border-top:1px solid #e0e0e0; padding-top:15px; }' +
        '</style></head><body>' +
        '<h1>Order Details — Primejo</h1>' +
        content +
        '<div class="footer">Printed on ' + printDate + ' — Primejo Admin</div>' +
        '<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}};<\/script>' +
        '</body></html>'
    );
    win.document.close();
}

// ==================== REPORTS ====================

async function loadReports() {
    try {
        const fromDate = document.getElementById('reportFromDate')?.value;
        const toDate   = document.getElementById('reportToDate')?.value;

        // Pass date range + high limit to backend so SQL filters — avoids the
        // default 100-order cap that caused older orders to be invisible in reports
        const filters = { limit: 10000 };
        if (fromDate) filters.from_date = fromDate;
        if (toDate)   filters.to_date   = toDate;

        let orders = await getOrders(filters);

        const dateLabel = (fromDate || toDate)
            ? `<p style="margin-bottom:0.75rem;font-size:0.85rem;color:#888;">Showing: ${fromDate || '…'} → ${toDate || '…'}</p>`
            : '';

        const total = orders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
        const delivered = orders.filter(o => (o.order_status || o.status) === 'delivered');

        // Delivery fee breakdown across ALL orders

        let totalActualDelivery = 0;
        let totalCollectedShipping = 0;
        let deliveryDiff = 0;
        delivered.forEach(o => {
            totalActualDelivery += parseFloat(o.actual_shipping_cost || 0);
            totalCollectedShipping += parseFloat(o.displayed_shipping_cost || o.delivery_fee || 0);

            deliveryDiff += parseFloat(o.displayed_shipping_cost || o.delivery_fee || 0) - parseFloat(o.actual_shipping_cost || 0);

        });
        const deliveryDiffColor = deliveryDiff >= 0 ? '#16a34a' : '#dc2626';
        const deliveryDiffLabel = deliveryDiff >= 0 ? 'surplus' : 'deficit';

        // Net Profit = total collected − actual delivery cost − cost price of items sold
        let totalProfit = 0;
        delivered.forEach(o => {
            const orderTotal     = parseFloat(o.total || 0);
            const actualDelivery = parseFloat(o.actual_shipping_cost || 0);
            const itemsCost = (o.items || []).reduce((sum, item) => {
                return sum + (parseFloat(item.cost_price || 0) * (item.quantity || 1));
            }, 0);
            totalProfit += orderTotal - actualDelivery - itemsCost;
        });

        const deliveredRevenue = delivered.reduce((s, o) => s + parseFloat(o.total || 0), 0);


        setEl('reportStats', `
            ${dateLabel}
            <div class="stats-grid">
                <div class="stat-card"><h3>Total Orders</h3><p class="stat-number">${orders.length}</p></div>
                <div class="stat-card"><h3>Delivered Orders</h3><p class="stat-number">${delivered.length}</p></div>
                <div class="stat-card"><h3>Total Revenue</h3><p class="stat-number">${total.toFixed(2)}JD</p></div>
                <div class="stat-card"><h3>Delivered Revenue</h3><p class="stat-number">${deliveredRevenue.toFixed(2)}JD</p></div>
                <div class="stat-card" style="border-color:#16a34a;">
                    <h3 style="color:#16a34a;">Net Profit</h3>
                    <p class="stat-number" style="color:#16a34a;">${totalProfit.toFixed(2)}JD</p>
                    <small style="color:#888;font-size:0.75rem;">Revenue − Actual Delivery − Cost Price</small>
                </div>
            </div>
            <h4 style="margin:1.5rem 0 0.75rem;font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;color:#888;">Delivery Fees Breakdown</h4>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Actual Delivery Cost</h3>
                    <p class="stat-number">${totalActualDelivery.toFixed(2)}JD</p>
                    <small style="color:#888;font-size:0.75rem;">Total paid to couriers (actual_shipping_cost)</small>
                </div>
                <div class="stat-card">
                    <h3>Collected from Customers</h3>
                    <p class="stat-number">${totalCollectedShipping.toFixed(2)}JD</p>
                    <small style="color:#888;font-size:0.75rem;">Shipping fees charged to customers</small>
                </div>
                <div class="stat-card" style="border-color:${deliveryDiffColor};">
                    <h3 style="color:${deliveryDiffColor};">Delivery Difference</h3>
                    <p class="stat-number" style="color:${deliveryDiffColor};">${deliveryDiff >= 0 ? '+' : ''}${deliveryDiff.toFixed(2)}JD</p>
                    <small style="color:#888;font-size:0.75rem;">Collected − Actual (${deliveryDiffLabel})</small>
                </div>
            </div>`);
    } catch (error) { console.error('Reports error:', error); }
}

async function exportOrders() {
    try {
        const fromDate = document.getElementById('reportFromDate')?.value;
        const toDate   = document.getElementById('reportToDate')?.value;

        const filters = { limit: 10000 };
        if (fromDate) filters.from_date = fromDate;
        if (toDate)   filters.to_date   = toDate;

        let orders = await getOrders(filters);

        let csv = 'Order ID,Customer,Phone,City,Country,Address,Items,Subtotal,Shipping,Total,Status,Date\n';
        orders.forEach(o => {
            const id = o.order_id || o.orderId;
            const name = o.customer_name || o.customerName;
            const phone = o.customer_phone || o.customerPhone;
            const status = o.order_status || o.status;
            const date = new Date(o.created_at || o.orderDate).toLocaleString();
            const items = (o.items || []).map(i => {
                const v = i.selected_variant || i.selectedColor || '';
                return `${i.productName || ''}${v ? ' (' + v + ')' : ''} x${i.quantity}`;
            }).join('; ');
            csv += `"${id}","${name}","${phone}","${o.delivery_city || ''}","${o.delivery_country || ''}","${o.delivery_address || ''}","${items}",${o.subtotal || 0},${o.displayed_shipping_cost || 0},${o.total},"${status}","${date}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `primejo_orders_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('✅ Orders exported!');
    } catch (error) { alert('Export error: ' + error.message); }
}

// ==================== DELIVERY ====================

async function loadDelivery() {
    if (typeof loadDeliverySection === 'function') loadDeliverySection();
}

// ==================== HELPERS ====================

function setEl(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

function setChecked(id, checked) {
    const el = document.getElementById(id);
    if (el) el.checked = checked;
}

function showLoading(id, msg = 'Loading...', cols = 1) {
    const el = document.getElementById(id);
    if (!el) return;
    const isTable = el.tagName === 'TBODY';
    el.innerHTML = isTable
        ? `<tr><td colspan="${cols}" style="text-align:center;padding:2rem;">${msg}</td></tr>`
        : `<div style="text-align:center;padding:2rem;color:#888;">${msg}</div>`;
}

function showToast(msg, duration = 3000) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position:fixed;bottom:30px;right:30px;
        background:#1a1a1a;color:white;
        border-left:4px solid #d4af37;
        padding:14px 24px;border-radius:4px;
        font-weight:600;font-size:0.95rem;
        z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.2);
        transition:opacity 0.3s;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}



// ==================== GENERAL INFO ====================

async function loadGeneralInfo() {
    try {
        const info = await getGeneralInfo();
        if (!info) return;
        setVal('brandName', info.brand_name || info.brandName || '');
        setVal('phoneNumber', info.phone_number || info.phoneNumber || '');
        setVal('emailAddress', info.email_address || info.email || '');
        setVal('whatsappNumber', info.whatsapp || '');
        setVal('instagramUrl', info.instagram || '');
        setVal('facebookUrl', info.facebook || '');
        setVal('snapchatUrl', info.snapchat || '');
        setVal('tiktokUrl', info.tiktok || '');
        setVal('youtubeUrl', info.youtube || '');
        setVal('freeDeliveryMin', info.minimum_order_amount || info.free_delivery_min_amount || '');
        setVal('deliveryNote', info.delivery_note || '');
        console.log('✅ General info loaded');
    } catch (err) {
        console.error('loadGeneralInfo error:', err);
    }
}

async function saveGeneralInfo(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    const data = {
        brand_name: document.getElementById('brandName')?.value || '',
        phone_number: document.getElementById('phoneNumber')?.value || '',
        email: document.getElementById('emailAddress')?.value || '',
        whatsapp: document.getElementById('whatsappNumber')?.value || '',
        instagram: document.getElementById('instagramUrl')?.value || '',
        facebook: document.getElementById('facebookUrl')?.value || '',
        snapchat: document.getElementById('snapchatUrl')?.value || '',
        tiktok: document.getElementById('tiktokUrl')?.value || '',
        youtube: document.getElementById('youtubeUrl')?.value || '',
        free_delivery_min_amount: parseFloat(document.getElementById('freeDeliveryMin')?.value) || 0,
        delivery_note: document.getElementById('deliveryNote')?.value || ''
    };
    try {
        const result = await updateGeneralInfo(data);
        if (result.error) { showToast('❌ Error: ' + result.error); }
        else { showToast('✅ General info saved!'); }
    } catch (err) {
        showToast('❌ ' + err.message);
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '💾 Save Changes'; }
    }
}

// ==================== CHANGE PASSWORD ====================

async function submitChangePassword(e) {
    e.preventDefault();
    const current = document.getElementById('currentPassword')?.value;
    const newPass = document.getElementById('newPassword')?.value;
    const confirm = document.getElementById('confirmPassword')?.value;
    const btn = e.target.querySelector('button[type="submit"]');
    const msgEl = document.getElementById('passwordMsg');

    if (!current || !newPass || !confirm) {
        if (msgEl) { msgEl.textContent = '⚠️ All fields are required.'; msgEl.style.color = 'red'; }
        return;
    }
    if (newPass.length < 8) {
        if (msgEl) { msgEl.textContent = '⚠️ Password must be at least 8 characters.'; msgEl.style.color = 'red'; }
        return;
    }
    if (newPass !== confirm) {
        if (msgEl) { msgEl.textContent = '⚠️ New passwords do not match.'; msgEl.style.color = 'red'; }
        return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    if (msgEl) msgEl.textContent = '';

    try {
        const result = await changePassword(current, newPass);
        if (result.error) {
            if (msgEl) { msgEl.textContent = '❌ ' + result.error; msgEl.style.color = 'red'; }
        } else {
            if (msgEl) { msgEl.textContent = '✅ Password changed successfully!'; msgEl.style.color = 'green'; }
            e.target.reset();
            showToast('✅ Password updated!');
        }
    } catch (err) {
        if (msgEl) { msgEl.textContent = '❌ ' + err.message; msgEl.style.color = 'red'; }
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🔒 Change Password'; }
    }
}

// ==================== REFUND ====================

function openRefundModal(orderId) {
    document.getElementById('refundOrderId').value = orderId;
    document.getElementById('refundReason').value = '';
    document.getElementById('refundMsg').textContent = '';
    document.getElementById('refundModal').classList.add('show');
}

function closeRefundModal() {
    document.getElementById('refundModal').classList.remove('show');
}

async function submitRefund(e) {
    e.preventDefault();
    const orderId = document.getElementById('refundOrderId').value;
    const reason = document.getElementById('refundReason').value.trim();
    const btn = e.target.querySelector('button[type="submit"]');
    const msgEl = document.getElementById('refundMsg');

    if (!reason) {
        msgEl.textContent = '⚠️ Please enter a refund reason.';
        msgEl.style.color = '#dc2626';
        return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }
    msgEl.textContent = '';

    try {

        const API_BASE = (typeof API_URL !== 'undefined' ? API_URL : 'https://primejo-ecommerce-backend-demo.up.railway.app/api');
        const res = await fetch(`${API_BASE}/orders/${orderId}/refund`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${getAdminToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ refund_reason: reason })
        });
        const data = await res.json();
        if (data.success) {
            closeRefundModal();
            showToast('💸 Order marked as refunded!');
            loadOrders(_ordersFilter, _ordersPage);
            loadDashboard();
        } else {
            msgEl.textContent = '❌ ' + (data.error || 'Failed to process refund');
            msgEl.style.color = '#dc2626';
        }
    } catch (err) {
        msgEl.textContent = '❌ ' + err.message;
        msgEl.style.color = '#dc2626';
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '💸 Confirm Refund'; }
    }
}

// ==================== EDIT ORDER ====================

async function openEditOrderModal(rawOrder) {
    const id = rawOrder.order_id || rawOrder.orderId;

    // Populate fields immediately so the modal feels responsive
    document.getElementById('editOrderId').value = id;
    document.getElementById('editCustomerName').value = rawOrder.customer_name || rawOrder.customerName || '';
    document.getElementById('editCustomerPhone').value = rawOrder.customer_phone || rawOrder.customerPhone || '';
    document.getElementById('editDeliveryCountry').value = rawOrder.delivery_country || '';
    document.getElementById('editDeliveryCity').value = rawOrder.delivery_city || '';
    document.getElementById('editDeliveryAddress').value = rawOrder.delivery_address || rawOrder.complete_address || rawOrder.deliveryAddress || '';
    document.getElementById('editDeliveryFee').value = parseFloat(rawOrder.displayed_shipping_cost || rawOrder.delivery_fee || 0).toFixed(2);
    document.getElementById('editOrderNotes').value = rawOrder.order_notes || rawOrder.orderNotes || '';
    document.getElementById('editOrderMsg').textContent = '';
    document.getElementById('editOrderItemsList').innerHTML = '<p style="color:#999;font-size:0.85rem;">Loading items…</p>';
    document.getElementById('editOrderModal').classList.add('show');

    // Fetch full order to get item row IDs (needed for the update endpoint)
    try {
        const API_BASE = (typeof API_URL !== 'undefined' ? API_URL : 'https://primejo-ecommerce-backend-demo.up.railway.app/api');
        const res = await fetch(`${API_BASE}/orders/${id}`, {
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        if (res.ok) {
            const order = await res.json();
            renderEditableItems(order.items || []);
        } else {
            renderEditableItems(rawOrder.items || []);
        }
    } catch (e) {
        renderEditableItems(rawOrder.items || []);
    }
}

function renderEditableItems(items) {
    const itemsList = document.getElementById('editOrderItemsList');
    if (!itemsList) return;
    if (!items.length) {
        itemsList.innerHTML = '<p style="color:#999;font-size:0.85rem;">No items found.</p>';
        return;
    }
    itemsList.innerHTML = items.map((item, i) => {
        const name = item.productNameAr || item.productName || '—';
        return `
            <div style="display:grid;grid-template-columns:1fr 70px 90px;gap:0.5rem;align-items:center;
                        padding:0.5rem 0.6rem;background:#f9f9f9;border-radius:6px;border:1px solid #eee;margin-bottom:0.35rem;">
                <div style="font-size:0.83rem;font-weight:600;direction:rtl;text-align:right;line-height:1.3;">${name}</div>
                <div>
                    <label style="font-size:0.68rem;color:#888;display:block;margin-bottom:2px;">Qty</label>
                    <input type="number" min="1" step="1" value="${item.quantity || 1}"
                           data-item-id="${item.id || ''}" data-index="${i}" data-field="quantity"
                           class="edit-item-field"
                           style="width:100%;padding:0.35rem 0.4rem;border:1.5px solid #e0e0e0;border-radius:4px;font-size:0.88rem;font-family:inherit;"
                           onfocus="this.style.borderColor='#1a1a1a'" onblur="this.style.borderColor='#e0e0e0'"
                           oninput="recalcEditTotal()">
                </div>
                <div>
                    <label style="font-size:0.68rem;color:#888;display:block;margin-bottom:2px;">Price (JD)</label>
                    <input type="number" min="0" step="0.01" value="${parseFloat(item.price || 0).toFixed(2)}"
                           data-item-id="${item.id || ''}" data-index="${i}" data-field="price"
                           class="edit-item-field"
                           style="width:100%;padding:0.35rem 0.4rem;border:1.5px solid #e0e0e0;border-radius:4px;font-size:0.88rem;font-family:inherit;"
                           onfocus="this.style.borderColor='#1a1a1a'" onblur="this.style.borderColor='#e0e0e0'"
                           oninput="recalcEditTotal()">
                </div>
            </div>`;
    }).join('');
    recalcEditTotal();
}

function recalcEditTotal() {
    let subtotal = 0;
    document.querySelectorAll('#editOrderItemsList > div').forEach(row => {
        const qty   = parseFloat(row.querySelector('[data-field="quantity"]')?.value) || 0;
        const price = parseFloat(row.querySelector('[data-field="price"]')?.value)    || 0;
        subtotal += qty * price;
    });
    const fee     = parseFloat(document.getElementById('editDeliveryFee')?.value) || 0;
    const totalEl = document.getElementById('editOrderTotalDisplay');
    if (totalEl) totalEl.textContent = `Subtotal: ${subtotal.toFixed(2)} JD  |  Total: ${(subtotal + fee).toFixed(2)} JD`;
}

function closeEditOrderModal() {
    document.getElementById('editOrderModal').classList.remove('show');
}

async function submitEditOrder(e) {
    e.preventDefault();
    const orderId = document.getElementById('editOrderId').value;
    const msgEl   = document.getElementById('editOrderMsg');
    const btn     = e.target.querySelector('button[type="submit"]');

    const body = {
        customer_name:    document.getElementById('editCustomerName').value.trim(),
        customer_phone:   document.getElementById('editCustomerPhone').value.trim(),
        delivery_country: document.getElementById('editDeliveryCountry').value.trim(),
        delivery_city:    document.getElementById('editDeliveryCity').value.trim(),
        delivery_address: document.getElementById('editDeliveryAddress').value.trim(),
        delivery_fee:     document.getElementById('editDeliveryFee').value,
        order_notes:      document.getElementById('editOrderNotes').value.trim(),
    };

    // Collect item edits (only rows that have a valid item id)
    const updatedItems = Array.from(document.querySelectorAll('#editOrderItemsList > div'))
        .map(row => ({
            id:       row.querySelector('[data-field="quantity"]')?.dataset.itemId || '',
            quantity: parseFloat(row.querySelector('[data-field="quantity"]')?.value) || 1,
            price:    parseFloat(row.querySelector('[data-field="price"]')?.value)    || 0,
        }))
        .filter(item => item.id);

    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
    msgEl.textContent = '';

    try {
        const API_BASE = (typeof API_URL !== 'undefined' ? API_URL : 'https://primejo-ecommerce-backend-demo.up.railway.app/api');

        // 1. Update order header fields
        const res  = await fetch(`${API_BASE}/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${getAdminToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!data.success) {
            msgEl.textContent = '❌ ' + (data.error || 'Failed to update order');
            msgEl.style.color = '#dc2626';
            return;
        }

        // 2. Update item quantities / prices if any items were loaded
        if (updatedItems.length > 0) {
            const itemsRes = await fetch(`${API_BASE}/orders/${orderId}/items`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${getAdminToken()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: updatedItems })
            });
            if (!itemsRes.ok) {
                const itemsData = await itemsRes.json().catch(() => ({}));
                msgEl.textContent = '⚠️ Order info saved but items update failed: ' + (itemsData.error || itemsRes.status);
                msgEl.style.color = '#d97706';
                loadOrders(_ordersFilter, _ordersPage);
                return;
            }
        }

        closeEditOrderModal();
        closeOrderModal();
        showToast('✅ Order updated successfully!');
        loadOrders(_ordersFilter, _ordersPage);
        loadDashboard();
    } catch (err) {
        msgEl.textContent = '❌ ' + err.message;
        msgEl.style.color = '#dc2626';
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '💾 Save Changes'; }
    }
}

// ==================== CANCEL ====================

function openCancelModal(orderId) {
    document.getElementById('cancelOrderId').value = orderId;
    document.getElementById('cancelReason').value = '';
    document.getElementById('cancelMsg').textContent = '';
    document.getElementById('cancelModal').classList.add('show');
}

function closeCancelModal() {
    document.getElementById('cancelModal').classList.remove('show');
}

async function submitCancel(e) {
    e.preventDefault();
    const orderId = document.getElementById('cancelOrderId').value;
    const reason = document.getElementById('cancelReason').value.trim();
    const btn = e.target.querySelector('button[type="submit"]');
    const msgEl = document.getElementById('cancelMsg');

    if (!reason) {
        msgEl.textContent = '⚠️ Please enter a cancellation reason.';
        msgEl.style.color = '#dc2626';
        return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }
    msgEl.textContent = '';

    try {
        const API_BASE = (typeof API_URL !== 'undefined' ? API_URL : 'https://primejo-ecommerce-backend-demo.up.railway.app/api');
        const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${getAdminToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ cancel_reason: reason })
        });
        const data = await res.json();
        if (data.success) {
            closeCancelModal();
            showToast('🚫 Order cancelled!');
            loadOrders(_ordersFilter, _ordersPage);
            loadDashboard();
        } else {
            msgEl.textContent = '❌ ' + (data.error || 'Failed to cancel order');
            msgEl.style.color = '#dc2626';
        }
    } catch (err) {
        msgEl.textContent = '❌ ' + err.message;
        msgEl.style.color = '#dc2626';
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🚫 Confirm Cancellation'; }
    }
}

// ==================== ACTIVITY LOG ====================

const LOG_ACTION_COLORS = {
    LOGIN: { bg: '#dbeafe', color: '#1d4ed8', label: '🔐 Login' },
    PASSWORD_CHANGE: { bg: '#ede9fe', color: '#6d28d9', label: '🔑 Password' },
    CREATE: { bg: '#dcfce7', color: '#15803d', label: '➕ Create' },
    UPDATE: { bg: '#fef9c3', color: '#a16207', label: '✏️ Update' },
    DELETE: { bg: '#fee2e2', color: '#b91c1c', label: '🗑️ Delete' },
    STATUS_CHANGE: { bg: '#e0f2fe', color: '#0369a1', label: '🔄 Status' },
    REFUND: { bg: '#f3e8ff', color: '#7c3aed', label: '💸 Refund' },
    CANCEL: { bg: '#fee2e2', color: '#dc2626', label: '🚫 Cancel' },
};

async function loadLogs(filterAction = '', filterUser = '') {
    const container = document.getElementById('logsTableBody');
    if (!container) return;

    // Build filter bar once
    const filterBar = document.getElementById('logsFilterBar');
    if (filterBar && !filterBar.dataset.built) {
        filterBar.dataset.built = '1';
        filterBar.innerHTML = `
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1rem;align-items:center;">
                <span style="font-weight:700;font-size:0.82rem;text-transform:uppercase;letter-spacing:1px;">Filter:</span>
                ${['', 'LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'REFUND', 'PASSWORD_CHANGE'].map(a => {
            const meta = LOG_ACTION_COLORS[a] || { bg: '#f0f0f0', color: '#333', label: 'All' };
            return `<button onclick="loadLogs('${a}', document.getElementById('logsUserSearch')?.value || '')"
                        id="logFilterBtn_${a || 'all'}"
                        style="padding:5px 14px;border:2px solid ${meta.bg};background:#fff;color:${meta.color};
                               font-size:0.8rem;font-weight:700;cursor:pointer;border-radius:3px;transition:all 0.15s;">
                        ${meta.label || 'All'}
                    </button>`;
        }).join('')}
            </div>
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:1.2rem;">
                <input id="logsUserSearch" type="text" placeholder="🔍 Filter by username..."
                    value="${filterUser}"
                    style="padding:7px 12px;border:1.5px solid #e0e0e0;font-size:0.88rem;outline:none;border-radius:3px;width:220px;"
                    oninput="loadLogs(document.getElementById('logFilterBtn_all') ? window._currentLogFilter || '' : '', this.value)"
                    onfocus="this.style.borderColor='#d4af37'" onblur="this.style.borderColor='#e0e0e0'">
                <button onclick="loadLogs('', ''); document.getElementById('logsUserSearch').value='';"
                    style="padding:7px 14px;background:#f0f0f0;border:none;font-size:0.82rem;font-weight:600;cursor:pointer;border-radius:3px;">
                    Clear
                </button>
                <button onclick="exportLogs()"
                    style="padding:7px 14px;background:#1a1a1a;color:#fff;border:none;font-size:0.82rem;font-weight:600;cursor:pointer;border-radius:3px;margin-left:auto;">
                    ⬇️ Export CSV
                </button>
            </div>
        `;
    }

    // Highlight active filter
    window._currentLogFilter = filterAction;
    ['', 'LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'REFUND', 'PASSWORD_CHANGE'].forEach(a => {
        const btn = document.getElementById('logFilterBtn_' + (a || 'all'));
        if (!btn) return;
        const meta = LOG_ACTION_COLORS[a] || { bg: '#e0e0e0', color: '#333' };
        const active = a === filterAction;
        btn.style.background = active ? meta.color : '#fff';
        btn.style.color = active ? '#fff' : meta.color;
        btn.style.borderColor = meta.color;
    });

    try {
        container.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#888;">Loading logs...</td></tr>';

        const API_BASE = (typeof API_URL !== 'undefined' ? API_URL : 'https://primejo-ecommerce-backend-demo.up.railway.app/api');
        const params = new URLSearchParams({ limit: 300 });
        if (filterAction) params.append('action', filterAction);
        if (filterUser) params.append('user', filterUser);

        const res = await fetch(`${API_BASE}/admin-logs?${params}`, {
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        const data = await res.json();

        if (!data.success || !data.logs.length) {
            container.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#aaa;">No logs found</td></tr>';
            const countEl = document.getElementById('logsCount');
            if (countEl) countEl.textContent = '0 entries';
            return;
        }

        const countEl = document.getElementById('logsCount');
        if (countEl) countEl.textContent = `${data.logs.length} of ${data.total} entries`;

        container.innerHTML = data.logs.map(log => {
            const meta = LOG_ACTION_COLORS[log.action] || { bg: '#f0f0f0', color: '#333', label: log.action };
            const date = new Date(log.created_at).toLocaleString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            const entityLabel = log.entity_type ? `<span style="color:#888;font-size:0.78rem;">${log.entity_type}${log.entity_id ? ' #' + log.entity_id : ''}</span>` : '—';
            return `
            <tr style="border-bottom:1px solid #f5f5f5;transition:background 0.1s;" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
                <td style="padding:10px 12px;white-space:nowrap;">
                    <span style="display:inline-block;padding:3px 10px;background:${meta.bg};color:${meta.color};
                                 font-size:0.75rem;font-weight:700;border-radius:3px;letter-spacing:0.3px;">
                        ${meta.label || log.action}
                    </span>
                </td>
                <td style="padding:10px 12px;font-weight:600;font-size:0.88rem;">${log.user_name || '—'}</td>
                <td style="padding:10px 12px;">${entityLabel}</td>
                <td style="padding:10px 12px;color:#444;font-size:0.88rem;max-width:320px;">${log.details || '—'}</td>
                <td style="padding:10px 12px;color:#888;font-size:0.8rem;white-space:nowrap;">${log.ip_address || '—'}</td>
                <td style="padding:10px 12px;color:#888;font-size:0.8rem;white-space:nowrap;">${date}</td>
            </tr>`;
        }).join('');

    } catch (err) {
        container.innerHTML = `<tr><td colspan="6" style="color:red;text-align:center;padding:2rem;">Error: ${err.message}</td></tr>`;
    }
}

async function exportLogs() {
    try {

        const API_BASE = (typeof API_URL !== 'undefined' ? API_URL : 'https://primejo-ecommerce-backend-demo.up.railway.app/api');
        const res = await fetch(`${API_BASE}/admin-logs?limit=9999`, {
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        const data = await res.json();
        if (!data.success) { alert('Failed to load logs'); return; }

        let csv = 'Action,User,Entity Type,Entity ID,Details,IP Address,Timestamp\n';
        data.logs.forEach(log => {
            const date = new Date(log.created_at).toLocaleString();
            csv += `"${log.action}","${log.user_name || ''}","${log.entity_type || ''}","${log.entity_id || ''}","${(log.details || '').replace(/"/g, '""')}","${log.ip_address || ''}","${date}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `primejo_admin_logs_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('✅ Logs exported!');
    } catch (err) {
        alert('Export error: ' + err.message);
    }
}

// ==================== INIT ====================

loadDashboard();

// ==================== BANNERS ====================

async function loadBanners() {
    const container = document.getElementById('bannersContainer');
    if (!container) return;
    try {
        const res = await fetch(`${API_URL}/banners`, { headers: getAuthHeaders() });
        const data = await res.json();
        const banners = data.banners || [];

        if (!banners.length) {
            container.innerHTML = '<p style="color:#888;text-align:center;padding:2rem;">No banners yet. Add your first banner below.</p>';
            return;
        }

        container.innerHTML = banners.map(b => `
            <div class="banner-card" style="border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;margin-bottom:1rem;">
                <div style="height:120px;background:${b.image_url ? `url('${b.image_url}') center/cover` : (b.bg_color || '#667eea')};position:relative;">
                    <div style="position:absolute;inset:0;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
                        <div style="color:white;text-align:center;">
                            <strong style="font-size:1.1rem;">${b.title_en || ''}</strong><br>
                            <small>${b.subtitle_en || ''}</small>
                        </div>
                    </div>
                </div>
                <div style="padding:0.75rem 1rem;display:flex;justify-content:space-between;align-items:center;background:#fafafa;">
                    <span style="font-size:0.8rem;color:#888;">Order: ${b.sort_order || 0} | ${b.is_active ? '✅ Active' : '❌ Inactive'}</span>
                    <div style="display:flex;gap:8px;">
                        <button onclick="editBanner(${JSON.stringify(b).replace(/"/g, '&quot;')})"
                            style="padding:5px 12px;background:#1a1a1a;color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.8rem;">
                            Edit
                        </button>
                        <button onclick="deleteBanner(${b.id})"
                            style="padding:5px 12px;background:#dc2626;color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.8rem;">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = '<p style="color:red;">Failed to load banners</p>';
    }
}

function editBanner(b) {
    document.getElementById('bannerEditId').value = b.id || '';
    document.getElementById('bannerTitleEn').value = b.title_en || '';
    document.getElementById('bannerTitleAr').value = b.title_ar || '';
    document.getElementById('bannerSubtitleEn').value = b.subtitle_en || '';
    document.getElementById('bannerSubtitleAr').value = b.subtitle_ar || '';
    document.getElementById('bannerBtnEn').value = b.btn_text_en || '';
    document.getElementById('bannerBtnAr').value = b.btn_text_ar || '';
    document.getElementById('bannerBtnLink').value = b.btn_link || '';
    document.getElementById('bannerImageUrl').value = b.image_url || '';
    document.getElementById('bannerBgColor').value = b.bg_color || '#667eea';
    document.getElementById('bannerSortOrder').value = b.sort_order || 0;
    document.getElementById('bannerIsActive').checked = b.is_active !== false;
    document.getElementById('bannerFormTitle').textContent = 'Edit Banner';
    document.getElementById('bannerForm').scrollIntoView({ behavior: 'smooth' });
}

function resetBannerForm() {
    document.getElementById('bannerEditId').value = '';
    document.getElementById('bannerForm').reset();
    document.getElementById('bannerFormTitle').textContent = 'Add New Banner';
    document.getElementById('bannerBgColor').value = '#667eea';
}

async function saveBanner(e) {
    e.preventDefault();
    const id = document.getElementById('bannerEditId').value;
    const payload = {
        title_en: document.getElementById('bannerTitleEn').value,
        title_ar: document.getElementById('bannerTitleAr').value,
        subtitle_en: document.getElementById('bannerSubtitleEn').value,
        subtitle_ar: document.getElementById('bannerSubtitleAr').value,
        btn_text_en: document.getElementById('bannerBtnEn').value,
        btn_text_ar: document.getElementById('bannerBtnAr').value,
        btn_link: document.getElementById('bannerBtnLink').value,
        image_url: document.getElementById('bannerImageUrl').value,
        bg_color: document.getElementById('bannerBgColor').value,
        sort_order: parseInt(document.getElementById('bannerSortOrder').value) || 0,
        is_active: document.getElementById('bannerIsActive').checked
    };

    const url = id ? `${API_URL}/banners/${id}` : `${API_URL}/banners`;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) {
            alert(id ? 'Banner updated!' : 'Banner added!');
            resetBannerForm();
            loadBanners();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (err) {
        alert('Failed to save banner');
    }
}

async function deleteBanner(id) {
    if (!confirm('Delete this banner?')) return;
    try {
        const res = await fetch(`${API_URL}/banners/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success) { loadBanners(); }
        else alert('Error: ' + data.error);
    } catch (err) {
        alert('Failed to delete banner');
    }
}