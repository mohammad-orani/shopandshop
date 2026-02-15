# 🚀 KIWI E-COMMERCE - Visual Studio Code Setup

## ⚡ Super Quick Start (3 Steps!)

### Step 1️⃣: Extract & Open in VS Code
```
1. Extract kiwi-ecommerce-complete.tar.gz
2. Open VS Code
3. File → Open Folder → Select "kiwi-ecommerce"
```

### Step 2️⃣: Install Live Server Extension
```
1. Click Extensions icon (Ctrl+Shift+X)
2. Search: "Live Server"
3. Click "Install" on "Live Server by Ritwick Dey"
```

### Step 3️⃣: Run the Website
```
1. In VS Code Explorer, navigate to: frontend/index.html
2. Right-click → "Open with Live Server"
3. Browser opens automatically! 🎉
```

**That's it!** The website is now running with demo data.

---

## 📦 Optional: Full Setup with Backend & Database

### Prerequisites Installation

#### 1. Install Node.js
- Download: https://nodejs.org
- Choose: LTS version (recommended)
- Verify: Open terminal → type `node --version`

#### 2. Install MySQL
**Option A - XAMPP (Easier):**
- Download: https://www.apachefriends.org
- Install and start MySQL from XAMPP Control Panel

**Option B - MySQL Standalone:**
- Download: https://dev.mysql.com/downloads/mysql/
- Remember your root password during installation

---

## 🗄️ Database Setup (5 minutes)

### Using XAMPP:
```
1. Start XAMPP Control Panel
2. Click "Start" for MySQL
3. Click "Admin" for MySQL (opens phpMyAdmin)
4. Click "New" to create database
5. Name: kiwi_ecommerce
6. Click "Import" tab
7. Choose file: kiwi-ecommerce/database/schema.sql
8. Click "Go"
✅ Done!
```

### Using MySQL Command Line:
```bash
# In VS Code Terminal (Ctrl+`)
mysql -u root -p
# Enter your password

# Then type:
CREATE DATABASE kiwi_ecommerce;
exit

# Import schema:
mysql -u root -p kiwi_ecommerce < database/schema.sql
```

---

## 🔧 Backend Setup (3 minutes)

### In VS Code Terminal:
```bash
# Navigate to backend
cd backend

# Install packages
npm install

# Create config file
cp .env.example .env
```

### Edit .env file:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=kiwi_ecommerce
```

### Start Backend:
```bash
npm start
```

✅ You should see: "Kiwi E-Commerce API running on port 3000"

---

## 🌐 Running Everything

### Terminal Layout in VS Code:

**Terminal 1 (Backend):**
```bash
cd backend
npm start
```
Keep this running ✓

**Then use Live Server for Frontend:**
- Right-click `frontend/index.html`
- Select "Open with Live Server"
- Opens at: http://127.0.0.1:5500/frontend/index.html

**Admin Panel:**
- Right-click `admin/index.html`
- Select "Open with Live Server"
- Or navigate to: http://127.0.0.1:5500/admin/index.html

---

## 🎯 Quick Access URLs

After setup, bookmark these:

| Page | URL |
|------|-----|
| Customer Site | http://127.0.0.1:5500/frontend/index.html |
| Admin Panel | http://127.0.0.1:5500/admin/index.html |
| API Products | http://localhost:3000/api/products |
| API Categories | http://localhost:3000/api/categories |

---

## 📁 Project Structure in VS Code

```
kiwi-ecommerce/
│
├── 📂 frontend/               ← Customer Website
│   ├── index.html            ← Start here with Live Server
│   ├── product.html
│   ├── cart.html
│   ├── checkout.html
│   ├── styles.css
│   └── app.js
│
├── 📂 admin/                  ← Admin Panel
│   ├── index.html            ← Admin dashboard
│   ├── admin-styles.css
│   └── admin.js
│
├── 📂 backend/                ← API Server
│   ├── server.js             ← Main server file
│   ├── package.json
│   └── .env                  ← Your config
│
├── 📂 database/               ← SQL Schema
│   └── schema.sql
│
└── 📄 Documentation
    ├── README.md
    ├── QUICKSTART.md
    └── VS-CODE-SETUP.md      ← This file!
```

---

## 🎨 VS Code Tips

### Split Screen for Development:
```
1. Open index.html
2. Click split icon (top right)
3. Open styles.css in second pane
4. Edit and see live changes!
```

### Multi-Terminal Setup:
```
Terminal → Split Terminal
- Left: Backend (npm start)
- Right: Git/commands
```

### Keyboard Shortcuts:
- `Ctrl + `` → Toggle Terminal
- `Ctrl + B` → Toggle Sidebar
- `Ctrl + P` → Quick Open File
- `Alt + Click` → Multiple Cursors
- `Ctrl + /` → Comment Line

---

## ✅ Testing Your Setup

### 1. Test Frontend (No backend needed):
- Open with Live Server
- Should see: Slider, products, language toggle
- Try: Switching language, adding to cart

### 2. Test Backend:
```bash
# In browser, visit:
http://localhost:3000/api/products

# Should see JSON with products
```

### 3. Test Admin:
- Open admin/index.html
- Should see: Dashboard with stats
- Try: Adding a product

---

## 🐛 Troubleshooting

### ❌ Live Server not working?
**Solution:**
1. Extensions → Search "Live Server"
2. Click Install
3. Reload VS Code
4. Try again

### ❌ Backend won't start?
**Check:**
```bash
# Node.js installed?
node --version

# In backend folder?
cd backend

# Dependencies installed?
npm install
```

### ❌ Can't connect to database?
**Check:**
1. MySQL is running (XAMPP or standalone)
2. Database created: `kiwi_ecommerce`
3. Credentials correct in `backend/.env`
4. Test: `mysql -u root -p`

### ❌ Port already in use?
**Backend (port 3000):**
```bash
# Windows:
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

**Live Server (port 5500):**
- Change in VS Code settings
- Or close other Live Server instances

---

## 🎓 Development Workflow

### Daily Development:
```
1. Open VS Code
2. Open project folder
3. Start backend: cd backend → npm start
4. Open frontend with Live Server
5. Code and watch changes live!
```

### Making Changes:
- **Frontend**: Edit HTML/CSS/JS → Auto-refreshes
- **Backend**: Edit server.js → Manual restart (Ctrl+C, npm start)
- **Database**: Edit in phpMyAdmin or MySQL Workbench

---

## 🚀 What's Next?

### Customize:
1. Change colors in `styles.css`
2. Add your logo to `index.html`
3. Modify product categories

### Add Real Products:
1. Open admin panel
2. Go to Products section
3. Click "Add New Product"
4. Fill in bilingual details

### Deploy:
- Frontend: Netlify, Vercel, GitHub Pages
- Backend: Heroku, DigitalOcean, Railway
- Database: Cloud MySQL service

---

## 🆘 Need Help?

### Check These Files:
1. `README.md` - Full documentation
2. `QUICKSTART.md` - Quick setup guide
3. Browser Console (F12) - For frontend errors
4. VS Code Terminal - For backend errors

### Common Issues:
- Products not showing? → Check browser console
- Backend errors? → Check terminal output
- Database issues? → Verify MySQL is running

---

## 📚 Learn More

### Technologies Used:
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Tools**: VS Code, Live Server

### File to Edit Often:
- `frontend/app.js` - Main functionality
- `frontend/styles.css` - Styling
- `backend/server.js` - API endpoints
- `admin/admin.js` - Admin features

---

**💡 Pro Tip:** Keep backend terminal running while you develop!

**🎉 Happy Coding!**
