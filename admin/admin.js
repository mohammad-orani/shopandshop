// ==================== ADMIN.JS - DATABASE CONNECTED ====================
// All data now goes to Railway MySQL via admin-api.js
// admin-api.js MUST be loaded BEFORE this file

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

    // Load section data
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

        const [products, orders] = await Promise.all([
            getProducts(),
            getOrders()
        ]);

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
            const items = order.items?.length || 0;
            
            return `
                <div class="order-item">
                    <div>
                        <strong>${id}</strong><br>
                        ${name} - ${items} items
                    </div>
                    <div>
                        <strong>$${parseFloat(order.total || 0).toFixed(2)}</strong><br>
                        <span class="status-badge status-${status}">${status}</span>
                    </div>
                </div>
            `;
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

        console.log('📦 Products loaded:', products);

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;">No products found. Add your first product!</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.id}</td>
                <td><img src="${p.image || p.image_url || ''}" 
                         class="product-img" 
                         alt="${p.name_en}"
                         onerror="this.src='https://placehold.co/60x60?text=No+Img'"
                         style="width:60px;height:60px;object-fit:cover;"></td>
                <td>${p.name_en}</td>
                <td>${p.category || p.category_id || '-'}</td>
                <td>$${parseFloat(p.newPrice || p.new_price || 0).toFixed(2)}</td>
                <td>${p.stock || 0}</td>
                <td>
                    <span class="status-badge status-${(p.visible !== false && p.is_visible !== false) ? 'visible' : 'hidden'}">
                        ${(p.visible !== false && p.is_visible !== false) ? 'Visible' : 'Hidden'}
                    </span>
                </td>
                <td>
                    <button class="btn-info" onclick="editProduct(${p.id})">Edit</button>
                    <button class="btn-danger" onclick="confirmDeleteProduct(${p.id})">Delete</button>
                </td>
            </tr>
        `).join('');

        await loadCategoryOptions();

    } catch (error) {
        console.error('Load products error:', error);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:red;">
            Error loading products: ${error.message}
        </td></tr>`;
    }
}

async function loadCategoryOptions() {
    const select = document.getElementById('productCategory');
    if (!select) return;

    try {
        const categories = await getCategories();
        select.innerHTML = '<option value="">-- Select Category --</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.name_en}</option>`).join('');
    } catch (e) {
        console.error('Load category options error:', e);
    }
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
        setVal('productQuantityToSell', p.quantityToSell || p.quantity_to_sell || p.stock || 0);
        setVal('productCostPrice', p.costPrice || p.cost_price || 0);
        setVal('productOldPrice', p.oldPrice || p.old_price || 0);
        setVal('productNewPrice', p.newPrice || p.new_price || 0);
        setVal('productImage', p.image || p.image_url || '');
        setVal('productAdditionalImages',
            Array.isArray(p.additionalImages) ? p.additionalImages.join(', ') :
            (p.additional_images || ''));
        setVal('productVideo', p.videoUrl || p.video_url || '');

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

        if (result.error) {
            alert('Error: ' + result.error);
            return;
        }

        showToast('✅ Product deleted successfully!');
        loadProducts();

    } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting product: ' + error.message);
    }
}

// Product Form Submit
document.getElementById('productFormElement')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn?.textContent;
    if (submitBtn) {
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;
    }

    try {
        const productId = document.getElementById('productId')?.value;

        const additionalImagesText = document.getElementById('productAdditionalImages')?.value || '';
        const additionalImages = additionalImagesText
            .split(',').map(u => u.trim()).filter(u => u);

        const productData = {
            name_en: document.getElementById('productNameEn')?.value || '',
            name_ar: document.getElementById('productNameAr')?.value || '',
            description_en: document.getElementById('productDescEn')?.value || '',
            description_ar: document.getElementById('productDescAr')?.value || '',
            category: document.getElementById('productCategory')?.value || '',
            category_id: document.getElementById('productCategory')?.value || '',
            stock: parseInt(document.getElementById('productStock')?.value || 0),
            quantityToSell: parseInt(document.getElementById('productQuantityToSell')?.value || 0),
            costPrice: parseFloat(document.getElementById('productCostPrice')?.value || 0),
            oldPrice: parseFloat(document.getElementById('productOldPrice')?.value || 0),
            newPrice: parseFloat(document.getElementById('productNewPrice')?.value || 0),
            old_price: parseFloat(document.getElementById('productOldPrice')?.value || 0),
            new_price: parseFloat(document.getElementById('productNewPrice')?.value || 0),
            image: document.getElementById('productImage')?.value || '',
            image_url: document.getElementById('productImage')?.value || '',
            additionalImages: additionalImages,
            videoUrl: document.getElementById('productVideo')?.value || '',
            isNew: document.getElementById('productNew')?.checked || false,
            is_new: document.getElementById('productNew')?.checked || false,
            topSeller: document.getElementById('productTopSeller')?.checked || false,
            is_top_seller: document.getElementById('productTopSeller')?.checked || false,
            isOffer: document.getElementById('productOffer')?.checked || false,
            is_offer: document.getElementById('productOffer')?.checked || false,
            visible: document.getElementById('productVisible')?.checked !== false,
            is_visible: document.getElementById('productVisible')?.checked !== false,
        };

        let result;
        if (productId) {
            result = await updateProduct(productId, productData);
        } else {
            result = await createProduct(productData);
        }

        if (result.error) {
            alert('❌ Error: ' + result.error);
            return;
        }

        showToast('✅ Product saved successfully!');
        hideProductForm();
        loadProducts();

    } catch (error) {
        console.error('Save product error:', error);
        alert('❌ Error saving product: ' + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
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
                <div style="font-weight:600;margin-bottom:0.5rem;">Image ${i+1}</div>
                <img src="${url}" style="width:100%;height:160px;object-fit:cover;"
                     onerror="this.style.display='none'">
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
    if (container && inner) {
        inner.innerHTML = content;
        container.style.display = 'block';
    }
}

// ==================== CATEGORIES ====================

async function loadCategories() {
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) return;

    try {
        showLoading('categoriesTableBody', 'Loading categories...', 4);

        const categories = await getCategories();

        console.log('📦 Categories loaded:', categories);

        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;">No categories yet. Add your first category!</td></tr>';
            return;
        }

        tbody.innerHTML = categories.map(cat => `
            <tr>
                <td>${cat.id}</td>
                <td>${cat.name_en}</td>
                <td>${cat.name_ar}</td>
                <td>
                    <button class="btn-danger" onclick="confirmDeleteCategory('${cat.id}')">Delete</button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Load categories error:', error);
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
    } catch (error) {
        alert('Error: ' + error.message);
    }
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

    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
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
            const id = order.order_id || order.orderId;
            const name = order.customer_name || order.customerName;
            const phone = order.customer_phone || order.customerPhone;
            const status = order.order_status || order.status;
            const total = parseFloat(order.total || 0);
            const date = new Date(order.created_at || order.orderDate).toLocaleDateString();

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
                        <option value="pending" ${status==='pending'?'selected':''}>Pending</option>
                        <option value="processing" ${status==='processing'?'selected':''}>Processing</option>
                        <option value="completed" ${status==='completed'?'selected':''}>Completed</option>
                        <option value="cancelled" ${status==='cancelled'?'selected':''}>Cancelled</option>
                    </select>
                </td>
            </tr>`;
        }).join('');

    } catch (error) {
        console.error('Load orders error:', error);
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
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function viewOrderDetails(orderId) {
    try {
        const orders = await getOrders();
        const order = orders.find(o => (o.order_id || o.orderId) == orderId);
        if (!order) { alert('Order not found'); return; }

        const status = order.order_status || order.status;
        const name = order.customer_name || order.customerName;
        const phone = order.customer_phone || order.customerPhone;
        const address = order.complete_address || order.deliveryAddress || '';
        const total = parseFloat(order.total || 0);

        document.getElementById('orderDetailsContent').innerHTML = `
            <div style="margin-bottom:1rem;">
                <strong>Order ID:</strong> ${order.order_id || order.orderId}<br>
                <strong>Date:</strong> ${new Date(order.created_at || order.orderDate).toLocaleString()}<br>
                <strong>Status:</strong> <span class="status-badge status-${status}">${status}</span>
            </div>
            <div style="margin-bottom:1rem;">
                <h4>Customer</h4>
                <strong>Name:</strong> ${name}<br>
                <strong>Phone:</strong> ${phone}<br>
                <strong>Address:</strong> ${address}<br>
                ${order.order_notes || order.orderNotes ? `<strong>Notes:</strong> ${order.order_notes || order.orderNotes}<br>` : ''}
                <strong>Payment:</strong> ${order.payment_method || order.paymentMethod || 'N/A'}
            </div>
            <div style="margin-top:1rem;text-align:right;">
                <strong style="font-size:1.5rem;">Total: $${total.toFixed(2)}</strong>
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
            </div>
        `);
    } catch (error) {
        console.error('Reports error:', error);
    }
}

async function exportOrders() {
    try {
        const fromDate = document.getElementById('reportFromDate')?.value;
        const toDate = document.getElementById('reportToDate')?.value;

        let orders = await getOrders();

        if (fromDate) orders = orders.filter(o => new Date(o.created_at || o.orderDate) >= new Date(fromDate));
        if (toDate) orders = orders.filter(o => new Date(o.created_at || o.orderDate) <= new Date(toDate));

        let csv = 'Order ID,Customer,Phone,Address,Items,Total,Status,Date\n';
        orders.forEach(o => {
            const id = o.order_id || o.orderId;
            const name = o.customer_name || o.customerName;
            const phone = o.customer_phone || o.customerPhone;
            const addr = o.complete_address || o.deliveryAddress || '';
            const status = o.order_status || o.status;
            const date = new Date(o.created_at || o.orderDate).toLocaleString();
            csv += `"${id}","${name}","${phone}","${addr}",${o.items?.length||0},${o.total},"${status}","${date}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('✅ Orders exported!');
    } catch (error) {
        alert('Export error: ' + error.message);
    }
}

// ==================== DELIVERY ====================

async function loadDelivery() {
    if (typeof loadDeliverySection === 'function') {
        loadDeliverySection();
    }
}

// ==================== HELPER FUNCTIONS ====================

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
        background:#1a8a4a;color:white;
        padding:14px 24px;border-radius:8px;
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