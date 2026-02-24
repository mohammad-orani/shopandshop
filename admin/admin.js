// ==================== ADMIN.JS - DATABASE CONNECTED ====================

// ==================== NAVIGATION ====================

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    const section = document.getElementById(sectionId);
    if (section) section.classList.add('active');

    const link = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (link) link.classList.add('active');

    const titles = {
        'dashboard': 'Dashboard',
        'products': 'Product Management',
        'categories': 'Category Management',
        'orders': 'Order Management',
        'delivery': 'Delivery Management',
        'reports': 'Reports & Export'
    };

    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titles[sectionId] || sectionId;

    if (sectionId === 'dashboard') loadDashboard();
    if (sectionId === 'products') loadProducts();
    if (sectionId === 'categories') loadCategories();
    if (sectionId === 'orders') loadOrders();
    if (sectionId === 'delivery') loadDelivery();
    if (sectionId === 'reports') loadReports();
}

// ==================== DASHBOARD ====================

async function loadDashboard() {
    try {
        showLoading('recentOrdersList', 'Loading dashboard...');

        const [products, orders] = await Promise.all([getProducts(), getOrders()]);

        const pendingOrders = orders.filter(o => (o.order_status || o.status) === 'pending');
        const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

        setEl('totalProducts', products.length);
        setEl('totalOrders', orders.length);
        setEl('pendingOrders', pendingOrders.length);
        setEl('totalRevenue', `$${totalRevenue.toFixed(2)}`);

        const recentOrders = orders.slice(0, 5);
        const recentHTML = recentOrders.map(order => {
            const id = order.order_id || order.orderId;
            const name = order.customer_name || order.customerName;
            const status = order.order_status || order.status;
            return `
                <div class="order-item">
                    <div>
                        <strong>${id}</strong><br>
                        ${name}
                    </div>
                    <div>
                        <strong>$${parseFloat(order.total || 0).toFixed(2)}</strong><br>
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

        tbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.id}</td>
                <td><img src="${p.image || p.image_url || ''}" class="product-img" alt="${p.name_en}"
                         onerror="this.src='https://placehold.co/60x60?text=No+Img'"
                         style="width:60px;height:60px;object-fit:cover;"></td>
                <td>${p.name_en}</td>
                <td>${p.category || p.category_id || '-'}</td>
                <td>$${parseFloat(p.newPrice || p.new_price || 0).toFixed(2)}</td>
                <td>${p.stock || 0}</td>
                <td><span class="status-badge status-${(p.visible !== false && p.is_visible !== false) ? 'visible' : 'hidden'}">
                    ${(p.visible !== false && p.is_visible !== false) ? 'Visible' : 'Hidden'}</span></td>
                <td>
                    <button class="btn-info" onclick="editProduct(${p.id})">Edit</button>
                    <button class="btn-danger" onclick="confirmDeleteProduct(${p.id})">Delete</button>
                </td>
            </tr>`).join('');

        await loadCategoryOptions();
    } catch (error) {
        console.error('Load products error:', error);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:red;">Error: ${error.message}</td></tr>`;
    }
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

function showAddProductForm() {
    const form = document.getElementById('productForm');
    if (!form) return;
    form.style.display = 'block';
    setEl('formTitle', 'Add New Product');
    document.getElementById('productFormElement')?.reset();
    const idEl = document.getElementById('productId');
    if (idEl) idEl.value = '';
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
        setChecked('productVisible', p.visible !== false && p.is_visible !== false);

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
            is_visible: document.getElementById('productVisible')?.checked !== false,
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
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;">No categories yet.</td></tr>';
            return;
        }
        tbody.innerHTML = categories.map(cat => `
            <tr>
                <td>${cat.id}</td>
                <td>${cat.name_en}</td>
                <td>${cat.name_ar}</td>
                <td><button class="btn-danger" onclick="confirmDeleteCategory('${cat.id}')">Delete</button></td>
            </tr>`).join('');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:red;">Error: ${error.message}</td></tr>`;
    }
}

function showAddCategoryForm() {
    const form = document.getElementById('categoryForm');
    if (form) form.style.display = 'block';
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
    try {
        const categoryData = {
            id: document.getElementById('categoryId')?.value,
            name_en: document.getElementById('categoryNameEn')?.value,
            name_ar: document.getElementById('categoryNameAr')?.value
        };
        const result = await createCategory(categoryData);
        if (result.error) { alert('❌ Error: ' + result.error); return; }
        showToast('✅ Category added!');
        hideCategoryForm();
        loadCategories();
    } catch (error) { alert('❌ Error: ' + error.message); }
});

// ==================== ORDERS ====================

async function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    try {
        showLoading('ordersTableBody', 'Loading orders...', 8);
        const orders = await getOrders();

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;">No orders yet</td></tr>';
            return;
        }

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
                <td>$${total.toFixed(2)}</td>
                <td>${date}</td>
                <td><span class="status-badge status-${status}">${status}</span></td>
                <td>
                    <button class="btn-info" onclick="viewOrderDetails('${id}')">View</button>
                    <select onchange="changeOrderStatus('${id}', this.value)" style="margin-left:5px;">
                        <option value="">Change Status</option>
                        <option value="pending"    ${status==='pending'?'selected':''}>Pending</option>
                        <option value="processing" ${status==='processing'?'selected':''}>Processing</option>
                        <option value="shipped"    ${status==='shipped'?'selected':''}>Shipped</option>
                        <option value="delivered"  ${status==='delivered'?'selected':''}>Delivered</option>
                        <option value="cancelled"  ${status==='cancelled'?'selected':''}>Cancelled</option>
                    </select>
                </td>
            </tr>`;
        }).join('');

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="8" style="color:red;text-align:center;">Error: ${error.message}</td></tr>`;
    }
}

async function changeOrderStatus(orderId, newStatus) {
    if (!newStatus) return;
    try {
        const result = await updateOrderStatus(orderId, newStatus);
        if (result.error) { alert('Error: ' + result.error); return; }
        showToast('✅ Order status updated!');
        loadOrders();
        loadDashboard();
    } catch (error) { alert('Error: ' + error.message); }
}

async function viewOrderDetails(orderId) {
    try {
        // Try fetching single order with items from dedicated endpoint first
        let order = null;
        try {
            const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken') || '';
            const API_URL = (typeof window.API_URL !== 'undefined' ? window.API_URL : '') || window.location.origin;
            const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.order_id) order = data;
            }
        } catch(e) { /* fallback below */ }

        // Fallback: search in already-loaded orders list
        if (!order) {
            const orders = await getOrders();
            order = orders.find(o => (o.order_id || o.orderId) == orderId);
        }

        if (!order) { alert('Order not found'); return; }

        const status  = order.order_status || order.status;
        const name    = order.customer_name || order.customerName;
        const phone   = order.customer_phone || order.customerPhone;
        const city    = order.delivery_city || '';
        const country = order.delivery_country || '';
        const address = order.delivery_address || order.complete_address || order.deliveryAddress || '';
        const notes   = order.order_notes || order.orderNotes || '';
        const payment = order.payment_method || order.paymentMethod || 'N/A';
        const total   = parseFloat(order.total || 0);
        const displayedShipping = parseFloat(order.displayed_shipping_cost || order.delivery_fee || 0);
        const subtotal = parseFloat(order.subtotal || 0);
        const date    = new Date(order.created_at || order.orderDate).toLocaleString();

        // Build items HTML
        let itemsHTML = '';
        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
            const rows = order.items.map(item => {
                const name  = item.productName || item.product_name || item.productNameAr || '—';
                const qty   = item.quantity || 0;
                const price = parseFloat(item.price || 0).toFixed(2);
                const total = parseFloat(item.total || 0).toFixed(2);
                const img   = item.image_url || '';
                return `
                    <tr style="border-bottom:1px solid #f0f0f0;">
                        <td style="padding:10px 12px;">
                            <div style="display:flex;align-items:center;gap:10px;">
                                ${img ? `<img src="${img}" style="width:44px;height:44px;object-fit:cover;border-radius:4px;border:1px solid #e8e8e8;flex-shrink:0;" onerror="this.style.display='none'">` : ''}
                                <span style="font-weight:500;line-height:1.3;">${name}</span>
                            </div>
                        </td>
                        <td style="padding:10px 12px;text-align:center;color:#555;">${qty}</td>
                        <td style="padding:10px 12px;text-align:right;color:#555;">$${price}</td>
                        <td style="padding:10px 12px;text-align:right;font-weight:700;color:#1a1a1a;">$${total}</td>
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
                    ${notes   ? `<div><strong>Notes:</strong> <em>${notes}</em></div>` : ''}
                </div>

                <!-- Order items table -->
                ${itemsHTML}

                <!-- Totals -->
                <div style="border-top:2px solid #1a1a1a;padding-top:0.8rem;">
                    ${subtotal > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:0.3rem;color:#666;">
                        <span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>` : ''}
                    ${displayedShipping > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:0.3rem;color:#666;">
                        <span>Shipping</span><span>$${displayedShipping.toFixed(2)}</span></div>` : ''}
                    <div style="display:flex;justify-content:space-between;font-size:1.3rem;font-weight:900;margin-top:0.4rem;">
                        <span>Total</span>
                        <span style="color:#1a1a1a;">$${total.toFixed(2)}</span>
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

// ==================== REPORTS ====================

async function loadReports() {
    try {
        const orders = await getOrders();
        const total = orders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
        const completed = orders.filter(o => (o.order_status || o.status) === 'completed');
        const completedRevenue = completed.reduce((s, o) => s + parseFloat(o.total || 0), 0);

        setEl('reportStats', `
            <div class="stats-grid">
                <div class="stat-card"><h3>Total Orders</h3><p class="stat-number">${orders.length}</p></div>
                <div class="stat-card"><h3>Completed</h3><p class="stat-number">${completed.length}</p></div>
                <div class="stat-card"><h3>Total Revenue</h3><p class="stat-number">$${total.toFixed(2)}</p></div>
                <div class="stat-card"><h3>Completed Revenue</h3><p class="stat-number">$${completedRevenue.toFixed(2)}</p></div>
            </div>`);
    } catch (error) { console.error('Reports error:', error); }
}

async function exportOrders() {
    try {
        const fromDate = document.getElementById('reportFromDate')?.value;
        const toDate   = document.getElementById('reportToDate')?.value;
        let orders = await getOrders();

        if (fromDate) orders = orders.filter(o => new Date(o.created_at||o.orderDate) >= new Date(fromDate));
        if (toDate)   orders = orders.filter(o => new Date(o.created_at||o.orderDate) <= new Date(toDate));

        let csv = 'Order ID,Customer,Phone,City,Country,Address,Items,Subtotal,Shipping,Total,Status,Date\n';
        orders.forEach(o => {
            const id     = o.order_id || o.orderId;
            const name   = o.customer_name || o.customerName;
            const phone  = o.customer_phone || o.customerPhone;
            const status = o.order_status || o.status;
            const date   = new Date(o.created_at||o.orderDate).toLocaleString();
            const items  = (o.items||[]).map(i => `${i.productName||''}x${i.quantity}`).join('; ');
            csv += `"${id}","${name}","${phone}","${o.delivery_city||''}","${o.delivery_country||''}","${o.delivery_address||''}","${items}",${o.subtotal||0},${o.displayed_shipping_cost||0},${o.total},"${status}","${date}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
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

// ==================== INIT ====================

loadDashboard();