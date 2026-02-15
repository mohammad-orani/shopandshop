# 🔧 Troubleshooting: "schema.prisma: file not found"

## ❌ The Error

```
Error: schema.prisma: file not found
```

## 🎯 What This Means

This error occurs when:
1. You're running a **Prisma** command
2. But this project **doesn't use Prisma**
3. Our project uses **direct MySQL** connection

---

## ✅ Correct Way to Run the Project

### Our Project Stack:
```
Frontend: HTML + JavaScript (Vanilla)
Backend: Node.js + Express + MySQL2
Database: MySQL (direct connection, no ORM)
```

**We DO NOT use:**
- ❌ Prisma
- ❌ Sequelize  
- ❌ TypeORM
- ❌ Any ORM

**We DO use:**
- ✅ Direct MySQL queries with mysql2
- ✅ Plain SQL
- ✅ Express REST API

---

## 🚀 How to Properly Run the Project

### Method 1: Demo Mode (No Database)

**Quick test without database setup:**

```bash
# Just open the HTML files directly!

# Option A: Use Live Server (VS Code)
1. Right-click on frontend/index.html
2. Click "Open with Live Server"

# Option B: Open directly in browser
1. Navigate to: kiwi-ecommerce/frontend/
2. Double-click index.html
3. Opens in browser

# For Admin:
1. Navigate to: kiwi-ecommerce/admin/
2. Double-click index.html
```

**Demo mode uses localStorage - no backend needed!**

---

### Method 2: With Database (Production Mode)

**Step-by-step backend setup:**

#### 1. Install MySQL (if not installed)

**Using XAMPP (Recommended):**
```
1. Download: https://www.apachefriends.org
2. Install XAMPP
3. Open XAMPP Control Panel
4. Click "Start" for MySQL
5. MySQL runs on port 3306
```

#### 2. Create Database

**In phpMyAdmin (XAMPP):**
```
1. Click "Admin" for MySQL in XAMPP
2. Click "New" to create database
3. Name: kiwi_ecommerce
4. Click "Create"
```

**Or via command line:**
```bash
mysql -u root -p
CREATE DATABASE kiwi_ecommerce;
exit
```

#### 3. Import Schema

**In phpMyAdmin:**
```
1. Select "kiwi_ecommerce" database
2. Click "Import" tab
3. Choose file: kiwi-ecommerce/database/schema.sql
4. Click "Go"
```

**Or via command line:**
```bash
cd kiwi-ecommerce
mysql -u root -p kiwi_ecommerce < database/schema.sql
```

#### 4. Configure Backend

**Edit file:** `backend/.env`

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=kiwi_ecommerce
DB_PORT=3306
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
```

#### 5. Install Backend Dependencies

```bash
# Navigate to backend folder
cd kiwi-ecommerce/backend

# Install packages
npm install
```

**Packages installed:**
- express
- mysql2 (NOT Prisma!)
- cors
- body-parser
- bcrypt
- jsonwebtoken
- dotenv

#### 6. Start Backend Server

```bash
# Make sure you're in backend folder
cd backend

# Start server
npm start
```

**Expected output:**
```
✓ Server running on port 3000
✓ Database connected successfully
```

#### 7. Test Backend

**Open browser:**
```
http://localhost:3000/api/products
```

**Expected response:**
```json
{
  "products": []
}
```

#### 8. Run Frontend

**With Live Server:**
```
1. Open VS Code
2. Right-click frontend/index.html
3. Select "Open with Live Server"
4. Browser opens automatically
```

**Or direct:**
```
1. Double-click frontend/index.html
2. Opens in default browser
```

---

## 🔍 Common Issues & Solutions

### Issue 1: "Prisma command not found"

**Problem:** You typed a Prisma command
```bash
npx prisma migrate dev  ❌
npx prisma generate     ❌
```

**Solution:** Don't use Prisma commands! Use these instead:
```bash
# Start backend
cd backend
npm start               ✓

# Import database
mysql -u root -p kiwi_ecommerce < database/schema.sql  ✓
```

---

### Issue 2: "Cannot find module 'prisma'"

**Problem:** Trying to import Prisma in code

**Solution:** Use mysql2 instead!

**Wrong:**
```javascript
import { PrismaClient } from '@prisma/client'  ❌
```

**Correct:**
```javascript
const mysql = require('mysql2/promise');      ✓
```

Our `backend/server.js` already has this!

---

### Issue 3: "npm start" doesn't work

**Problem:** Various errors when starting backend

**Solutions:**

**A. Not in backend folder:**
```bash
# Wrong
cd kiwi-ecommerce
npm start  ❌

# Correct
cd kiwi-ecommerce/backend
npm start  ✓
```

**B. Dependencies not installed:**
```bash
cd backend
npm install  ← Run this first!
npm start
```

**C. MySQL not running:**
```
1. Open XAMPP Control Panel
2. Click "Start" for MySQL
3. MySQL should show green
4. Try npm start again
```

**D. Wrong .env configuration:**
```env
# Check these are correct:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=        ← Empty for XAMPP
DB_NAME=kiwi_ecommerce
```

---

### Issue 4: "Database not found"

**Error:**
```
Error: ER_BAD_DB_ERROR: Unknown database 'kiwi_ecommerce'
```

**Solution:** Create the database!
```bash
mysql -u root -p
CREATE DATABASE kiwi_ecommerce;
exit
```

---

### Issue 5: Port 3000 already in use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution A:** Stop other app using port 3000
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

**Solution B:** Change port in .env
```env
PORT=3001  ← Use different port
```

Then visit: `http://localhost:3001/api/products`

---

## 📝 Complete Startup Checklist

### For Demo Mode (No Database):
```
□ Extract project files
□ Open frontend/index.html in browser
□ Works immediately! ✓
```

### For Production Mode (With Database):
```
□ Install MySQL (XAMPP)
□ Start MySQL in XAMPP
□ Create database: kiwi_ecommerce
□ Import schema.sql
□ Edit backend/.env
□ cd backend
□ npm install
□ npm start
□ Check http://localhost:3000/api/products
□ Open frontend/index.html
□ Everything connected! ✓
```

---

## 🎯 Quick Commands Reference

### Frontend Only (No Backend):
```bash
# Option 1: Live Server
Right-click index.html → Open with Live Server

# Option 2: Direct
Double-click index.html

# No commands needed!
```

### Backend + Database:
```bash
# 1. Start MySQL
Open XAMPP → Start MySQL

# 2. Create database (once)
mysql -u root -p
CREATE DATABASE kiwi_ecommerce;
exit

# 3. Import schema (once)
cd kiwi-ecommerce
mysql -u root -p kiwi_ecommerce < database/schema.sql

# 4. Install dependencies (once)
cd backend
npm install

# 5. Start backend (every time)
npm start

# 6. Open frontend
Open frontend/index.html in browser
```

---

## 📂 Project Structure Reminder

```
kiwi-ecommerce/
├── frontend/           ← HTML + JS (client-side)
│   ├── index.html     ← Open this in browser
│   ├── api.js         ← Connects to backend
│   └── app.js
│
├── admin/              ← Admin panel
│   ├── index.html     ← Open this for admin
│   └── admin.js
│
├── backend/            ← Node.js API server
│   ├── server.js      ← Main server file (uses mysql2)
│   ├── package.json   ← Dependencies list
│   └── .env           ← Database config
│
└── database/
    └── schema.sql     ← Import this to MySQL
```

**No Prisma anywhere!**

---

## 🆘 Still Getting Prisma Error?

### Check What Command You're Running:

**If you typed:**
```bash
npx prisma db push       ❌ Wrong!
npx prisma migrate dev   ❌ Wrong!
npx prisma studio        ❌ Wrong!
```

**You should type:**
```bash
cd backend
npm start                ✓ Correct!
```

### Check Your Terminal Location:

```bash
# Where are you?
pwd

# Should be in backend folder:
/path/to/kiwi-ecommerce/backend

# If not:
cd kiwi-ecommerce/backend
npm start
```

---

## 💡 Understanding the Setup

### Our Database Setup:
```
MySQL Database
    ↓
Direct Connection (mysql2)
    ↓
Express API (backend/server.js)
    ↓
REST API Endpoints
    ↓
Frontend JavaScript
```

### NOT Using:
```
MySQL Database
    ↓
Prisma ORM ❌
    ↓
Express API
```

**We connect directly to MySQL!**

---

## ✅ Correct Workflow

### Daily Development:

**Morning:**
```bash
1. Open XAMPP → Start MySQL
2. cd kiwi-ecommerce/backend
3. npm start
4. Open frontend/index.html in browser
5. Start coding!
```

**Evening:**
```bash
1. Ctrl+C to stop backend
2. Close XAMPP (stops MySQL)
3. Done!
```

---

## 📞 Quick Help

**Error: "schema.prisma not found"**
→ Don't use Prisma commands! Use `npm start`

**Error: "Cannot connect to database"**
→ Start MySQL in XAMPP first

**Error: "Port 3000 in use"**
→ Change PORT in .env or kill process

**Error: "Module not found"**
→ Run `npm install` in backend folder

**Want demo mode?**
→ Just open frontend/index.html directly!

---

## 🎓 Summary

**You DON'T need:**
- ❌ Prisma
- ❌ prisma migrate
- ❌ prisma generate
- ❌ schema.prisma file

**You DO need:**
- ✅ MySQL running (XAMPP)
- ✅ Database created
- ✅ Schema imported
- ✅ Backend configured (.env)
- ✅ npm start (in backend folder)
- ✅ Open frontend/index.html

**That's it! Simple and straightforward! 🎉**
