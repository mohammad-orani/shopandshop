// Get data from localStorage
function getProducts() {
    return JSON.parse(localStorage.getItem('products')) || [];
}

function saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products));
}

function getOrders() {
    return JSON.parse(localStorage.getItem('orders')) || [];
}

function saveOrders(orders) {
    localStorage.setItem('orders', JSON.stringify(orders));
}

function getCategories() {
    // Categories are now managed through admin panel
    // Initialize empty array if none exists
    const storedCategories = localStorage.getItem('categories');
    if (!storedCategories) {
        localStorage.setItem('categories', JSON.stringify([]));
        return [];
    }
    return JSON.parse(storedCategories);
}

function saveCategories(categories) {
    localStorage.setItem('categories', JSON.stringify(categories));
}

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');

    const titles = {
        'dashboard': 'Dashboard',
        'products': 'Product Management',
        'categories': 'Category Management',
        'orders': 'Order Management',
        'reports': 'Reports & Export'
    };

    document.getElementById('pageTitle').textContent = titles[sectionId];

    // Load section data
    if (sectionId === 'dashboard') loadDashboard();
    if (sectionId === 'products') loadProducts();
    if (sectionId === 'categories') loadCategories();
    if (sectionId === 'orders') loadOrders();
    if (sectionId === 'reports') loadReports();
}

// Dashboard
function loadDashboard() {
    const products = getProducts();
    const orders = getOrders();
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('pendingOrders').textContent = pendingOrders.length;
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;

    // Show recent orders
    const recentOrders = orders.slice(-5).reverse();
    const recentOrdersHTML = recentOrders.map(order => `
        <div class="order-item">
            <div>
                <strong>${order.orderId}</strong><br>
                ${order.customerName} - ${order.items.length} items
            </div>
            <div>
                <strong>$${order.total.toFixed(2)}</strong><br>
                <span class="status-badge status-${order.status}">${order.status}</span>
            </div>
        </div>
    `).join('');

    document.getElementById('recentOrdersList').innerHTML = recentOrdersHTML || '<p>No orders yet</p>';
}

// Products Management

// Media Preview Functions
function previewMainImage() {
    const imageUrl = document.getElementById('productImage').value;
    if (!imageUrl) {
        alert('Please enter an image URL first');
        return;
    }

    const previewContainer = document.getElementById('mediaPreview');
    const previewContent = document.getElementById('previewContent');

    previewContent.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <strong>Main Product Image:</strong>
        </div>
        <img src="${imageUrl}" 
             alt="Main Product" 
             style="max-width: 400px; max-height: 400px; border: 2px solid var(--primary-black); display: block;"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
        <div style="display: none; padding: 2rem; background: #ffebee; border: 2px solid #c62828; color: #c62828;">
            ⚠️ Failed to load image. Please check the URL.
        </div>
    `;

    previewContainer.style.display = 'block';
}

function previewAdditionalImages() {
    const imagesText = document.getElementById('productAdditionalImages').value;
    if (!imagesText) {
        alert('Please enter image URLs first');
        return;
    }

    const imageUrls = imagesText.split(',').map(url => url.trim()).filter(url => url);
    const previewContainer = document.getElementById('mediaPreview');
    const previewContent = document.getElementById('previewContent');

    let html = `
        <div style="margin-bottom: 1rem;">
            <strong>Additional Images (${imageUrls.length}):</strong>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
    `;

    imageUrls.forEach((url, index) => {
        html += `
            <div style="border: 2px solid var(--primary-black); padding: 0.5rem; background: white;">
                <div style="margin-bottom: 0.5rem; font-weight: 600;">Image ${index + 1}</div>
                <img src="${url}" 
                     alt="Additional ${index + 1}" 
                     style="width: 100%; height: 200px; object-fit: cover;"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div style="display: none; padding: 1rem; background: #ffebee; color: #c62828; text-align: center; font-size: 0.85rem;">
                    ⚠️ Failed to load
                </div>
            </div>
        `;
    });

    html += '</div>';
    previewContent.innerHTML = html;
    previewContainer.style.display = 'block';
}

function previewVideo() {
    const videoUrl = document.getElementById('productVideo').value;
    if (!videoUrl) {
        alert('Please enter a video URL first');
        return;
    }

    const previewContainer = document.getElementById('mediaPreview');
    const previewContent = document.getElementById('previewContent');

    let videoHtml = '';

    // Check if it's a YouTube URL
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        let videoId = '';
        if (videoUrl.includes('youtube.com/watch?v=')) {
            videoId = videoUrl.split('v=')[1]?.split('&')[0];
        } else if (videoUrl.includes('youtu.be/')) {
            videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
        }

        if (videoId) {
            videoHtml = `
                <iframe width="560" height="315" 
                        src="https://www.youtube.com/embed/${videoId}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                        style="border: 2px solid var(--primary-black);"></iframe>
            `;
        }
    }
    // Check if it's a Vimeo URL
    else if (videoUrl.includes('vimeo.com')) {
        const videoId = videoUrl.split('vimeo.com/')[1]?.split('?')[0];
        if (videoId) {
            videoHtml = `
                <iframe src="https://player.vimeo.com/video/${videoId}" 
                        width="560" height="315" 
                        frameborder="0" 
                        allow="autoplay; fullscreen; picture-in-picture" 
                        allowfullscreen
                        style="border: 2px solid var(--primary-black);"></iframe>
            `;
        }
    }
    // Direct video file
    else {
        videoHtml = `
            <video width="560" height="315" controls style="border: 2px solid var(--primary-black);">
                <source src="${videoUrl}">
                Your browser does not support the video tag.
            </video>
        `;
    }

    previewContent.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <strong>Product Video:</strong>
        </div>
        ${videoHtml || '<div style="padding: 2rem; background: #ffebee; border: 2px solid #c62828; color: #c62828;">⚠️ Invalid video URL format</div>'}
    `;

    previewContainer.style.display = 'block';
}

function loadProducts() {
    const products = getProducts();
    const tbody = document.getElementById('productsTableBody');

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No products found</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td><img src="${product.image}" class="product-img" alt="${product.name_en}"></td>
            <td>${product.name_en}</td>
            <td>${product.category}</td>
            <td>$${product.newPrice}</td>
            <td>${product.stock}</td>
            <td><span class="status-badge status-${product.visible !== false ? 'visible' : 'hidden'}">${product.visible !== false ? 'Visible' : 'Hidden'}</span></td>
            <td>
                <button class="btn-info" onclick="editProduct(${product.id})">Edit</button>
                <button class="btn-danger" onclick="deleteProduct(${product.id})">Delete</button>
            </td>
        </tr>
    `).join('');

    // Load categories into select
    loadCategoryOptions();
}

function loadCategoryOptions() {
    const categories = getCategories();
    const select = document.getElementById('productCategory');
    select.innerHTML = categories.map(cat => `<option value="${cat.id}">${cat.name_en}</option>`).join('');
}

function showAddProductForm() {
    document.getElementById('productForm').style.display = 'block';
    document.getElementById('formTitle').textContent = 'Add New Product';
    document.getElementById('productFormElement').reset();
    document.getElementById('productId').value = '';
    loadCategoryOptions();
}

function hideProductForm() {
    document.getElementById('productForm').style.display = 'none';
}

function editProduct(id) {
    const products = getProducts();
    const product = products.find(p => p.id === id);

    if (!product) return;

    document.getElementById('productForm').style.display = 'block';
    document.getElementById('formTitle').textContent = 'Edit Product';
    document.getElementById('productId').value = product.id;
    document.getElementById('productNameEn').value = product.name_en;
    document.getElementById('productNameAr').value = product.name_ar;
    document.getElementById('productDescEn').value = product.description_en;
    document.getElementById('productDescAr').value = product.description_ar;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productQuantityToSell').value = product.quantityToSell || product.stock;
    document.getElementById('productCostPrice').value = product.costPrice || 0;
    document.getElementById('productOldPrice').value = product.oldPrice;
    document.getElementById('productNewPrice').value = product.newPrice;
    document.getElementById('productImage').value = product.image;
    document.getElementById('productAdditionalImages').value = product.additionalImages ? product.additionalImages.join(', ') : '';
    document.getElementById('productVideo').value = product.videoUrl || '';
    document.getElementById('productNew').checked = product.isNew || false;
    document.getElementById('productTopSeller').checked = product.topSeller || false;
    document.getElementById('productOffer').checked = product.isOffer || false;
    document.getElementById('productVisible').checked = product.visible !== false;

    loadCategoryOptions();

    // Scroll to form
    document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
}

function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    let products = getProducts();
    products = products.filter(p => p.id !== id);
    saveProducts(products);
    loadProducts();
}

document.getElementById('productFormElement').addEventListener('submit', function (e) {
    e.preventDefault();

    const productId = document.getElementById('productId').value;
    let products = getProducts();

    // Parse additional images
    const additionalImagesText = document.getElementById('productAdditionalImages').value;
    const additionalImages = additionalImagesText
        ? additionalImagesText.split(',').map(url => url.trim()).filter(url => url)
        : [];

    const productData = {
        id: productId ? parseInt(productId) : Date.now(),
        name_en: document.getElementById('productNameEn').value,
        name_ar: document.getElementById('productNameAr').value,
        description_en: document.getElementById('productDescEn').value,
        description_ar: document.getElementById('productDescAr').value,
        category: document.getElementById('productCategory').value,
        stock: parseInt(document.getElementById('productStock').value),
        quantityToSell: parseInt(document.getElementById('productQuantityToSell').value),
        costPrice: parseFloat(document.getElementById('productCostPrice').value || 0),
        oldPrice: parseFloat(document.getElementById('productOldPrice').value),
        newPrice: parseFloat(document.getElementById('productNewPrice').value),
        image: document.getElementById('productImage').value,
        additionalImages: additionalImages,
        videoUrl: document.getElementById('productVideo').value,
        isNew: document.getElementById('productNew').checked,
        topSeller: document.getElementById('productTopSeller').checked,
        isTopSeller: document.getElementById('productTopSeller').checked, // Add both for compatibility
        isOffer: document.getElementById('productOffer').checked,
        visible: document.getElementById('productVisible').checked
    };

    if (productId) {
        // Update existing product
        const index = products.findIndex(p => p.id === parseInt(productId));
        products[index] = productData;
    } else {
        // Add new product
        products.push(productData);
    }

    saveProducts(products);
    hideProductForm();
    loadProducts();

    // Hide preview
    document.getElementById('mediaPreview').style.display = 'none';

    alert('Product saved successfully!');
});

// Categories Management
function loadCategories() {
    const categories = getCategories();
    const tbody = document.getElementById('categoriesTableBody');

    tbody.innerHTML = categories.map(cat => `
        <tr>
            <td>${cat.id}</td>
            <td>${cat.name_en}</td>
            <td>${cat.name_ar}</td>
            <td>
                <button class="btn-danger" onclick="deleteCategory('${cat.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function showAddCategoryForm() {
    document.getElementById('categoryForm').style.display = 'block';
}

function hideCategoryForm() {
    document.getElementById('categoryForm').style.display = 'none';
    document.getElementById('categoryFormElement').reset();
}

function deleteCategory(id) {
    if (!confirm('Are you sure? Products in this category may be affected.')) return;

    let categories = getCategories();
    categories = categories.filter(c => c.id !== id);
    saveCategories(categories);
    loadCategories();
}

document.getElementById('categoryFormElement').addEventListener('submit', function (e) {
    e.preventDefault();

    const categories = getCategories();
    const newCategory = {
        id: document.getElementById('categoryId').value,
        name_en: document.getElementById('categoryNameEn').value,
        name_ar: document.getElementById('categoryNameAr').value
    };

    if (categories.find(c => c.id === newCategory.id)) {
        alert('Category ID already exists!');
        return;
    }

    categories.push(newCategory);
    saveCategories(categories);
    hideCategoryForm();
    loadCategories();
    alert('Category added successfully!');
});

// Orders Management
function loadOrders() {
    const orders = getOrders();
    const tbody = document.getElementById('ordersTableBody');

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No orders found</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>${order.orderId}</td>
            <td>${order.customerName}</td>
            <td>${order.customerPhone}</td>
            <td>${order.items.length} items</td>
            <td>$${order.total.toFixed(2)}</td>
            <td>${new Date(order.orderDate).toLocaleDateString()}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>
                <button class="btn-info" onclick="viewOrderDetails('${order.orderId}')">View</button>
                <select onchange="updateOrderStatus('${order.orderId}', this.value)">
                    <option value="">Change Status</option>
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
        </tr>
    `).join('');
}

function updateOrderStatus(orderId, newStatus) {
    if (!newStatus) return;

    const orders = getOrders();
    const order = orders.find(o => o.orderId === orderId);
    if (order) {
        order.status = newStatus;
        saveOrders(orders);
        loadOrders();
        loadDashboard();
        alert('Order status updated!');
    }
}

function viewOrderDetails(orderId) {
    const orders = getOrders();
    const order = orders.find(o => o.orderId === orderId);

    if (!order) return;

    // Format address
    let addressHtml = '';
    if (order.deliveryCity) {
        addressHtml = `
            <strong>City:</strong> ${order.deliveryCity}<br>
            <strong>Street:</strong> ${order.deliveryStreet || 'N/A'}<br>
            <strong>Building:</strong> ${order.deliveryBuilding || 'N/A'}<br>
            ${order.deliveryFloor ? `<strong>Floor/Apt:</strong> ${order.deliveryFloor}<br>` : ''}
        `;
    } else {
        addressHtml = `<strong>Address:</strong> ${order.deliveryAddress}<br>`;
    }

    // Format currency
    const currencyInfo = order.currency ? `
        <strong>Currency:</strong> ${order.currency} 
        ${order.currencyRate ? `(Rate: ${order.currencyRate})` : ''}<br>
    ` : '';

    const detailsHTML = `
        <div style="margin-bottom: 1rem;">
            <strong>Order ID:</strong> ${order.orderId}<br>
            <strong>Date:</strong> ${new Date(order.orderDate).toLocaleString()}<br>
            <strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span><br>
            ${currencyInfo}
        </div>
        <div style="margin-bottom: 1rem;">
            <h4>Customer Information</h4>
            <strong>Name:</strong> ${order.customerName}<br>
            <strong>Phone:</strong> ${order.customerPhone}<br>
            ${addressHtml}
            ${order.orderNotes ? `<strong>Notes:</strong> ${order.orderNotes}<br>` : ''}
            <strong>Payment:</strong> ${order.paymentMethod}
        </div>
        <div>
            <h4>Order Items</h4>
            <table class="data-table" style="margin-top: 1rem;">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td>${item.productName}</td>
                            <td>${item.quantity}</td>
                            <td>$${item.price.toFixed(2)}</td>
                            <td>$${item.total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div style="margin-top: 1rem; text-align: right;">
            <strong style="font-size: 1.5rem;">Total: $${order.total.toFixed(2)}</strong>
            ${order.currency && order.currency !== 'JOD' ? `<br><span style="font-size: 1rem; color: #666;">(Original: ${order.total.toFixed(2)} ${order.currency})</span>` : ''}
        </div>
    `;

    document.getElementById('orderDetailsContent').innerHTML = detailsHTML;
    document.getElementById('orderModal').classList.add('show');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('show');
}

// Reports
function loadReports() {
    const orders = getOrders();
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const completedOrders = orders.filter(o => o.status === 'completed');
    const completedRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

    document.getElementById('reportStats').innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Orders</h3>
                <p class="stat-number">${orders.length}</p>
            </div>
            <div class="stat-card">
                <h3>Completed Orders</h3>
                <p class="stat-number">${completedOrders.length}</p>
            </div>
            <div class="stat-card">
                <h3>Total Revenue</h3>
                <p class="stat-number">$${totalRevenue.toFixed(2)}</p>
            </div>
            <div class="stat-card">
                <h3>Completed Revenue</h3>
                <p class="stat-number">$${completedRevenue.toFixed(2)}</p>
            </div>
        </div>
    `;
}

function exportOrders() {
    const fromDate = document.getElementById('reportFromDate').value;
    const toDate = document.getElementById('reportToDate').value;

    let orders = getOrders();

    // Filter by date if provided
    if (fromDate) {
        orders = orders.filter(o => new Date(o.orderDate) >= new Date(fromDate));
    }
    if (toDate) {
        orders = orders.filter(o => new Date(o.orderDate) <= new Date(toDate));
    }

    // Create CSV
    let csv = 'Order ID,Customer Name,Phone,Address,Items Count,Total,Status,Date\n';

    orders.forEach(order => {
        csv += `"${order.orderId}","${order.customerName}","${order.customerPhone}","${order.deliveryAddress}",${order.items.length},${order.total},"${order.status}","${new Date(order.orderDate).toLocaleString()}"\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}
// Load general info
async function loadGeneralInfo() {
    try {
        const response = await fetch(`${API_URL}/general-info`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('brandName').value = data.info.brand_name;
            document.getElementById('phoneNumber').value = data.info.phone_number;
            document.getElementById('emailAddress').value = data.info.email_address;
        }
    } catch (error) {
        console.error('Error loading general info:', error);
    }
}

// Save general info
document.getElementById('generalInfoForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const info = {
        brand_name: document.getElementById('brandName').value,
        phone_number: document.getElementById('phoneNumber').value,
        email_address: document.getElementById('emailAddress').value
    };

    try {
        const response = await fetch(`${API_URL}/general-info`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(info)
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ General info updated successfully!');
        } else {
            alert('❌ Failed to update: ' + data.error);
        }
    } catch (error) {
        console.error('Error updating general info:', error);
        alert('❌ Error updating general info');
    }
});

// Load on page load
loadGeneralInfo();
// Initialize on page load
loadDashboard();
