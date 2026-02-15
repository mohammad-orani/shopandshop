# Running Kiwi E-Commerce in Visual Studio Code

## Prerequisites
- Visual Studio Code installed
- Node.js installed (v14 or higher) - Download from https://nodejs.org
- MySQL installed (or use XAMPP/WAMP) - Download from https://www.mysql.com
- Live Server extension for VS Code (recommended)

## Step-by-Step Setup

### 1. Extract and Open Project
1. Extract `kiwi-ecommerce-complete.tar.gz`
2. Open VS Code
3. File → Open Folder → Select the `kiwi-ecommerce` folder

### 2. Install VS Code Extensions (Recommended)
- **Live Server** by Ritwick Dey - For running the frontend
- **MySQL** by Jun Han - For database management (optional)
- **REST Client** by Huachao Mao - For testing API (optional)

### 3. Database Setup

#### Option A: Using MySQL Workbench or Command Line
```bash
# Open terminal in VS Code (Ctrl+` or View → Terminal)
mysql -u root -p

# In MySQL:
CREATE DATABASE kiwi_ecommerce;
exit

# Import schema
mysql -u root -p kiwi_ecommerce < database/schema.sql
```

#### Option B: Using XAMPP
1. Start XAMPP Control Panel
2. Start MySQL
3. Open phpMyAdmin (http://localhost/phpmyadmin)
4. Create new database: `kiwi_ecommerce`
5. Import `database/schema.sql`

### 4. Backend Setup

```bash
# In VS Code terminal, navigate to backend folder
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file (in VS Code) with your database credentials:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_mysql_password
# DB_NAME=kiwi_ecommerce

# Start the backend server
npm start
```

You should see: `Kiwi E-Commerce API running on port 3000`

### 5. Running the Frontend

#### Option A: Using Live Server (Recommended)
1. Right-click on `frontend/index.html`
2. Select "Open with Live Server"
3. Your browser will open automatically at `http://127.0.0.1:5500/frontend/index.html`

#### Option B: Direct File Access
1. Right-click on `frontend/index.html`
2. Select "Reveal in File Explorer" (Windows) or "Reveal in Finder" (Mac)
3. Double-click `index.html` to open in browser

### 6. Running the Admin Panel

#### Using Live Server:
1. Right-click on `admin/index.html`
2. Select "Open with Live Server"

#### Or open directly in browser:
- Navigate to `http://127.0.0.1:5500/admin/index.html`

## VS Code Workspace Layout

For best experience, organize your workspace:

1. **Terminal Panel** (Ctrl+`):
   - Split terminal: One for backend server
   - Keep it running while developing

2. **Explorer Panel**:
   ```
   kiwi-ecommerce/
   ├── frontend/     ← Customer website files
   ├── admin/        ← Admin panel files
   ├── backend/      ← API server (keep running)
   └── database/     ← SQL schema
   ```

3. **Editor Tabs**:
   - Open files you're working on
   - Use split view for HTML + CSS

## Development Workflow

### Running Everything:

1. **Terminal 1** - Backend API:
   ```bash
   cd backend
   npm start
   ```

2. **Live Server** - Frontend:
   - Right-click `frontend/index.html` → Open with Live Server

3. **Browser Tabs**:
   - Customer site: `http://127.0.0.1:5500/frontend/index.html`
   - Admin panel: `http://127.0.0.1:5500/admin/index.html`

### Making Changes:

- **Frontend Changes**: Edit HTML/CSS/JS files, Live Server auto-refreshes
- **Backend Changes**: Save file, server auto-restarts (if using nodemon)
- **Database Changes**: Run SQL in MySQL Workbench or phpMyAdmin

## Quick Test

### Test the Frontend (No Backend Required):
1. Open `frontend/index.html` with Live Server
2. You should see:
   - Slider banner
   - Product listings
   - Language toggle (EN/ع)
   - Working navigation

### Test the Backend API:
```bash
# In terminal
curl http://localhost:3000/api/products

# Or open in browser:
http://localhost:3000/api/products
```

### Test Admin Panel:
1. Open `admin/index.html`
2. Dashboard should show statistics
3. Navigate to Products section
4. Try adding a new product

## Common Issues & Solutions

### Issue: "npm: command not found"
**Solution**: Install Node.js from https://nodejs.org

### Issue: "Cannot connect to MySQL"
**Solution**: 
- Check MySQL is running
- Verify credentials in `backend/.env`
- Test connection: `mysql -u root -p`

### Issue: Live Server not working
**Solution**:
- Install Live Server extension in VS Code
- Or use: `python -m http.server 8080` in frontend folder

### Issue: Port 3000 already in use
**Solution**:
- Change PORT in `backend/.env` to 3001
- Or kill process: `npx kill-port 3000`

### Issue: CORS errors in browser console
**Solution**: Backend already has CORS enabled, but make sure:
- Backend is running
- Check browser console for actual error

## File Structure for Development

```
Open these files frequently:

Frontend Development:
├── frontend/index.html       - Main page
├── frontend/styles.css       - Global styles
├── frontend/app.js           - Main JavaScript
├── frontend/product.html     - Product page
└── frontend/cart.html        - Shopping cart

Admin Development:
├── admin/index.html          - Admin dashboard
├── admin/admin.js            - Admin logic
└── admin/admin-styles.css    - Admin styles

Backend Development:
├── backend/server.js         - API endpoints
├── backend/.env              - Configuration
└── backend/package.json      - Dependencies

Database:
└── database/schema.sql       - Database structure
```

## VS Code Settings (Optional)

Create `.vscode/settings.json` in project root:
```json
{
  "liveServer.settings.port": 5500,
  "liveServer.settings.root": "/",
  "files.autoSave": "afterDelay",
  "editor.formatOnSave": true
}
```

## Debugging Tips

### Debug Frontend:
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for API calls
4. Use `console.log()` in JavaScript files

### Debug Backend:
1. Check VS Code terminal for errors
2. Add `console.log()` in `backend/server.js`
3. Server auto-restarts on file save (with nodemon)

### Debug Database:
1. Open MySQL Workbench
2. Run queries to check data
3. View tables in phpMyAdmin

## Next Steps

1. **Customize**: Edit colors, add your logo, modify content
2. **Add Products**: Use admin panel to add real products
3. **Test Orders**: Place test orders through the site
4. **Deploy**: When ready, deploy to web hosting

## Useful VS Code Shortcuts

- `Ctrl + `` - Toggle terminal
- `Ctrl + P` - Quick file open
- `Ctrl + Shift + P` - Command palette
- `Alt + Click` - Multiple cursors
- `Ctrl + /` - Toggle comment
- `F12` - Go to definition
- `Shift + Alt + F` - Format document

## Getting Help

If you encounter issues:
1. Check the terminal for error messages
2. Review browser console (F12)
3. Verify all services are running:
   - MySQL ✓
   - Backend API ✓
   - Live Server ✓

---

**Happy Coding! 🚀**
