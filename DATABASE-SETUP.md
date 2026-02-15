# 🗄️ Complete Database Setup Guide

## 🎯 Overview

This guide will help you switch from localStorage (demo mode) to a real MySQL database for production use.

---

## 📋 Prerequisites

Before starting, you need:

### 1. MySQL Database
**Option A: Local MySQL (Development)**
- XAMPP (Windows/Mac/Linux) - https://www.apachefriends.org
- MAMP (Mac) - https://www.mamp.info
- Standalone MySQL - https://dev.mysql.com/downloads/mysql/

**Option B: Cloud MySQL (Production)**
- AWS RDS - https://aws.amazon.com/rds/
- Google Cloud SQL - https://cloud.google.com/sql
- DigitalOcean Managed Databases
- PlanetScale - https://planetscale.com
- Railway - https://railway.app

### 2. Node.js
- Download: https://nodejs.org
- Version: 14 or higher
- Verify: `node --version`

### 3. Database Client (Optional but recommended)
- MySQL Workbench - https://www.mysql.com/products/workbench/
- phpMyAdmin (comes with XAMPP)
- TablePlus - https://tableplus.com
- DBeaver - https://dbeaver.io

---

## 🚀 Step 1: Install MySQL

### Using XAMPP (Recommended for Beginners)

**Windows/Mac/Linux:**

```
1. Download XAMPP from https://www.apachefriends.org
2. Install XAMPP
3. Open XAMPP Control Panel
4. Start "Apache" module
5. Start "MySQL" module
6. Click "Admin" for MySQL (opens phpMyAdmin)
```

**Default Credentials:**
- Host: `localhost`
- Port: `3306`
- Username: `root`
- Password: `` (empty by default)

### Using Standalone MySQL

**Install:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# macOS (using Homebrew)
brew install mysql
brew services start mysql

# Windows
Download installer from mysql.com
Run installer
Set root password during installation
```

**Verify Installation:**
```bash
mysql --version
# Should show: mysql Ver 8.0.x
```

---

## 🗄️ Step 2: Create Database

### Option A: Using phpMyAdmin (XAMPP)

```
1. Open XAMPP Control Panel
2. Click "Admin" for MySQL
3. phpMyAdmin opens in browser
4. Click "New" in left sidebar
5. Database name: kiwi_ecommerce
6. Collation: utf8mb4_unicode_ci
7. Click "Create"
```

### Option B: Using MySQL Command Line

```bash
# Login to MySQL
mysql -u root -p
# Enter password (empty if XAMPP)

# Create database
CREATE DATABASE kiwi_ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Verify
SHOW DATABASES;
# You should see kiwi_ecommerce in the list

# Exit
exit
```

### Option C: Using MySQL Workbench

```
1. Open MySQL Workbench
2. Connect to MySQL Server (localhost:3306)
3. Click "Schema" tab
4. Right-click → Create Schema
5. Name: kiwi_ecommerce
6. Charset: utf8mb4
7. Apply
```

---

## 📊 Step 3: Import Database Schema

### Import the Schema File

**File Location:** `database/schema.sql`

### Method A: Using phpMyAdmin

```
1. Open phpMyAdmin
2. Select "kiwi_ecommerce" database (left sidebar)
3. Click "Import" tab
4. Click "Choose File"
5. Select: kiwi-ecommerce/database/schema.sql
6. Scroll down, click "Go"
7. Wait for success message ✓
```

### Method B: Using Command Line

```bash
# Navigate to your project folder
cd kiwi-ecommerce

# Import schema
mysql -u root -p kiwi_ecommerce < database/schema.sql

# Enter password when prompted
# Success if no errors shown
```

### Method C: Using MySQL Workbench

```
1. Open MySQL Workbench
2. Connect to server
3. File → Open SQL Script
4. Select: database/schema.sql
5. Click lightning bolt icon (Execute)
6. Check output panel for success
```

### Verify Tables Created

```sql
USE kiwi_ecommerce;
SHOW TABLES;

-- You should see:
-- categories
-- products
-- users
-- orders
-- order_items
-- favorites
```

---

## 🔧 Step 4: Configure Backend

### Install Node.js Dependencies

```bash
# Navigate to backend folder
cd kiwi-ecommerce/backend

# Install packages
npm install

# This installs:
# - express
# - mysql2
# - cors
# - body-parser
# - bcrypt
# - jsonwebtoken
# - dotenv
```

### Create Environment File

```bash
# Copy example file
cp .env.example .env

# Or create manually
touch .env
```

### Edit .env File

**File:** `backend/.env`

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=kiwi_ecommerce
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret (change this!)
JWT_SECRET=your-super-secret-key-change-this-in-production

# CORS Settings
CORS_ORIGIN=http://localhost:5500

# Email Configuration (for future use)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Payment Gateway (for future use)
PAYMENT_API_KEY=your-payment-api-key
```

**Important Settings:**

For **XAMPP (Local Development):**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=kiwi_ecommerce
DB_PORT=3306
```

For **Cloud Database:**
```env
DB_HOST=your-db-host.com
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=kiwi_ecommerce
DB_PORT=3306
```

For **Production:**
```env
NODE_ENV=production
JWT_SECRET=generate-a-long-random-string-here
```

---

## 🚀 Step 5: Start Backend Server

### Start the Server

```bash
# Make sure you're in backend folder
cd backend

# Start server
npm start

# You should see:
# Server running on port 3000
# Database connected successfully
```

### Test the Server

**Open browser and visit:**
```
http://localhost:3000/api/products

You should see:
{"products": []} (empty array, which is correct!)
```

**Or test with curl:**
```bash
curl http://localhost:3000/api/products
```

### Common Startup Issues

**Error: "Cannot connect to database"**
```
Check:
□ MySQL is running (XAMPP panel shows green)
□ Database name is correct in .env
□ Username/password are correct
□ Port is 3306
```

**Error: "Port 3000 already in use"**
```
Solution 1: Stop other app using port 3000
Solution 2: Change PORT in .env to 3001
```

**Error: "Module not found"**
```
Solution: Run npm install again
cd backend
npm install
```

---

## 🔗 Step 6: Connect Frontend to Backend

### Update Frontend Files

The frontend needs to use API instead of localStorage.

### Create API Service File

**File:** `frontend/api.js`

```javascript
// API Base URL
const API_URL = 'http://localhost:3000/api';

// Get all products
async function getProductsFromAPI() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        return data.products || [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

// Get product by ID
async function getProductByIdFromAPI(id) {
    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        const data = await response.json();
        return data.product;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

// Get all categories
async function getCategoriesFromAPI() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const data = await response.json();
        return data.categories || [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

// Create order
async function createOrderAPI(orderData) {
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating order:', error);
        return null;
    }
}

// Export functions
window.API = {
    getProducts: getProductsFromAPI,
    getProductById: getProductByIdFromAPI,
    getCategories: getCategoriesFromAPI,
    createOrder: createOrderAPI
};
```

### Include API in HTML

**Add to all HTML files (before app.js):**

```html
<script src="api.js"></script>
<script src="app.js"></script>
```

---

## 🔄 Step 7: Update Admin Panel for Database

The admin panel needs to use API instead of localStorage.

### Create Admin API Service

**File:** `admin/admin-api.js`

```javascript
const API_URL = 'http://localhost:3000/api';

// Categories
async function getCategoriesAPI() {
    const response = await fetch(`${API_URL}/categories`);
    const data = await response.json();
    return data.categories || [];
}

async function addCategoryAPI(category) {
    const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
    });
    return await response.json();
}

async function deleteCategoryAPI(id) {
    const response = await fetch(`${API_URL}/categories/${id}`, {
        method: 'DELETE'
    });
    return await response.json();
}

// Products
async function getProductsAPI() {
    const response = await fetch(`${API_URL}/products`);
    const data = await response.json();
    return data.products || [];
}

async function addProductAPI(product) {
    const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
    });
    return await response.json();
}

async function updateProductAPI(id, product) {
    const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
    });
    return await response.json();
}

async function deleteProductAPI(id) {
    const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE'
    });
    return await response.json();
}

// Orders
async function getOrdersAPI() {
    const response = await fetch(`${API_URL}/orders`);
    const data = await response.json();
    return data.orders || [];
}

async function updateOrderStatusAPI(orderId, status) {
    const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
    return await response.json();
}

// Stats
async function getStatsAPI() {
    const response = await fetch(`${API_URL}/stats`);
    return await response.json();
}

window.AdminAPI = {
    // Categories
    getCategories: getCategoriesAPI,
    addCategory: addCategoryAPI,
    deleteCategory: deleteCategoryAPI,
    
    // Products
    getProducts: getProductsAPI,
    addProduct: addProductAPI,
    updateProduct: updateProductAPI,
    deleteProduct: deleteProductAPI,
    
    // Orders
    getOrders: getOrdersAPI,
    updateOrderStatus: updateOrderStatusAPI,
    
    // Stats
    getStats: getStatsAPI
};
```

---

## ✅ Step 8: Test Everything

### Test Checklist

```
Backend:
□ MySQL is running
□ Database created
□ Schema imported
□ Backend server started (npm start)
□ No errors in terminal
□ API responds at http://localhost:3000/api/products

Admin Panel:
□ Can add categories
□ Can add products
□ Can view orders
□ Data saves to database

Frontend:
□ Products display from database
□ Categories show in menu
□ Can add to cart
□ Can checkout
□ Orders save to database
```

### Test Categories

```
1. Open admin/index.html
2. Go to Categories
3. Add category: "electronics"
4. Check phpMyAdmin:
   SELECT * FROM categories;
   (Should show your category)
```

### Test Products

```
1. Admin → Products
2. Add new product
3. Check database:
   SELECT * FROM products;
   (Should show your product)
4. Check frontend:
   Open index.html
   (Product should appear)
```

### Test Orders

```
1. Frontend: Add product to cart
2. Go to checkout
3. Complete order
4. Check database:
   SELECT * FROM orders;
   SELECT * FROM order_items;
   (Should show order data)
5. Admin: View orders
   (Should see new order)
```

---

## 🔒 Security Considerations

### For Production

1. **Change JWT Secret:**
```env
JWT_SECRET=use-a-long-random-string-generated-by-crypto
```

Generate with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. **Set Strong Database Password:**
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your-strong-password';
FLUSH PRIVILEGES;
```

3. **Update .env:**
```env
DB_PASSWORD=your-strong-password
```

4. **Enable HTTPS:**
- Use SSL certificate
- Configure nginx/Apache
- Update CORS settings

5. **Never Commit .env:**
```bash
# Add to .gitignore
echo ".env" >> .gitignore
```

---

## 🌐 Deployment Options

### Option 1: Shared Hosting

**Requirements:**
- MySQL database
- Node.js support
- SSH access

**Providers:**
- HostGator (with Node.js addon)
- Bluehost
- A2 Hosting

### Option 2: VPS

**Requirements:**
- Linux server
- Install MySQL + Node.js
- Configure nginx

**Providers:**
- DigitalOcean ($5/month)
- Linode
- Vultr

### Option 3: Platform as a Service

**Frontend:**
- Netlify (free)
- Vercel (free)
- GitHub Pages (free)

**Backend + Database:**
- Railway (free tier)
- Render (free tier)
- Heroku ($7/month)

### Option 4: Cloud

**Full Stack:**
- AWS (EC2 + RDS)
- Google Cloud
- Azure

---

## 📞 Troubleshooting

### Database Connection Issues

**Error: ECONNREFUSED**
```
Problem: Can't connect to MySQL
Solutions:
1. Start MySQL (XAMPP panel)
2. Check port (should be 3306)
3. Verify host in .env (localhost)
```

**Error: Access Denied**
```
Problem: Wrong username/password
Solutions:
1. Check .env credentials
2. Try empty password for XAMPP
3. Reset MySQL password
```

**Error: Database doesn't exist**
```
Problem: Database not created
Solution:
CREATE DATABASE kiwi_ecommerce;
```

### API Issues

**Error: CORS Error**
```
Problem: Frontend can't access backend
Solution:
Check CORS_ORIGIN in .env matches frontend URL
```

**Error: 404 Not Found**
```
Problem: Wrong API URL
Solution:
Verify API_URL in api.js:
const API_URL = 'http://localhost:3000/api';
```

**Error: Cannot POST**
```
Problem: Backend not running
Solution:
cd backend
npm start
```

---

## 📚 Next Steps

After database is connected:

1. ✅ Add your categories through admin
2. ✅ Add your products through admin
3. ✅ Test ordering process
4. ✅ Set up email notifications
5. ✅ Configure payment gateway
6. ✅ Deploy to production server
7. ✅ Point domain name
8. ✅ Enable SSL certificate
9. ✅ Monitor and maintain

---

## 🎓 Summary

```
✅ MySQL installed and running
✅ Database created: kiwi_ecommerce
✅ Schema imported (5 tables)
✅ Backend configured (.env file)
✅ Dependencies installed (npm install)
✅ Server running (npm start)
✅ Frontend connected to API
✅ Admin panel connected to API
✅ Everything tested and working
```

**You're now running on a real database! 🎉**

**Admin URL:** http://localhost/admin/index.html (or your server)
**Frontend URL:** http://localhost/frontend/index.html
**Backend API:** http://localhost:3000/api
**Database:** localhost:3306/kiwi_ecommerce
