# Kiwi E-Commerce - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Option 1: Quick Demo (No Setup Required)
1. Extract the archive
2. Navigate to `frontend` folder
3. Open `index.html` in your web browser
4. Navigate to `admin` folder and open `index.html` for admin panel
5. **Done!** The site works with localStorage (demo data included)

### Option 2: Full Setup with Database

#### Step 1: Database Setup
```bash
# Create database
mysql -u root -p
CREATE DATABASE kiwi_ecommerce;
exit

# Import schema
mysql -u root -p kiwi_ecommerce < database/schema.sql
```

#### Step 2: Backend Setup
```bash
cd backend
npm install
cp .env.example .env

# Edit .env file with your database credentials
# Then start the server
npm start
```

#### Step 3: Access the Application
- **Customer Site**: Open `frontend/index.html`
- **Admin Panel**: Open `admin/index.html`
- **API**: http://localhost:3000

## 📁 Project Structure

```
kiwi-ecommerce/
├── frontend/          # Customer website (22 files)
│   ├── index.html     # Home page
│   ├── product.html   # Product details
│   ├── cart.html      # Shopping cart
│   ├── checkout.html  # Checkout
│   ├── about.html     # About page
│   ├── contact.html   # Contact page
│   ├── favorites.html # Favorites
│   ├── category.html  # Category products
│   └── styles/js files
│
├── admin/             # Admin panel
│   ├── index.html     # Dashboard
│   ├── admin.js       # Full CRUD operations
│   └── admin-styles.css
│
├── backend/           # Node.js API
│   ├── server.js      # Express server
│   ├── package.json   # Dependencies
│   └── .env.example   # Configuration
│
└── database/
    └── schema.sql     # MySQL database schema
```

## ✨ Key Features

### Customer Features
✅ Bilingual (English/Arabic with RTL)
✅ Product browsing with categories
✅ Shopping cart with quantity control
✅ Checkout with delivery info
✅ Favorites system
✅ Responsive design
✅ Black & white elegant theme

### Admin Features
✅ Product management (Add/Edit/Delete)
✅ Category management
✅ Order management with status updates
✅ Dashboard with statistics
✅ CSV export for reports
✅ Image & video support for products
✅ Stock management
✅ Show/hide products

## 🎯 Default Admin Credentials

If using the backend:
- Email: admin@kiwi.com
- Password: (set in database)

## 📊 Sample Data

The frontend includes 8 sample products in localStorage:
- Electronics (3 items)
- Personal Care (1 item)
- Home Supplies (1 item)
- Accessories (2 items)
- Gifts (1 item)

## 🔧 Customization

### Change Theme Colors
Edit `frontend/styles.css` and `admin/admin-styles.css`:
```css
:root {
    --primary-black: #000000;  /* Change to your color */
    --primary-white: #FFFFFF;  /* Change to your color */
}
```

### Add Payment Gateway
1. Configure in `backend/.env`
2. Update `backend/server.js` order endpoint
3. Update `frontend/checkout.html` form

### Add Email Notifications
1. Install nodemailer: `npm install nodemailer`
2. Configure email in `.env`
3. Add email logic to order creation

## 🌐 Deploy to Production

### Frontend (Static Hosting)
- Upload `frontend` folder to any static host
- Options: Netlify, Vercel, GitHub Pages

### Backend (Node.js Hosting)
- Deploy to: Heroku, DigitalOcean, AWS
- Set environment variables
- Configure MySQL database

### Database
- Use managed MySQL service
- Or self-host on VPS

## 📱 Browser Support
- Chrome ✅
- Firefox ✅
- Safari ✅
- Edge ✅
- Mobile browsers ✅

## 🆘 Troubleshooting

**Products not showing?**
- Check browser console for errors
- Clear localStorage: `localStorage.clear()`
- Refresh the page

**Admin panel not working?**
- Ensure you're using the correct file paths
- Check if localStorage has data

**Backend not starting?**
- Verify database credentials in `.env`
- Ensure MySQL is running
- Check if port 3000 is available

## 📞 Support

For issues or questions:
- Check README.md for detailed documentation
- Review database schema in `database/schema.sql`
- Inspect browser console for errors

## 🎓 Learn More

- Frontend uses vanilla JavaScript (no frameworks)
- Backend uses Express.js + MySQL
- Authentication with JWT
- RESTful API design
- Responsive CSS with Flexbox/Grid

---

**Built with ❤️ for your e-commerce success!**
