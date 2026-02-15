# PrimeJo E-Commerce Platform

A complete, full-stack e-commerce website with bilingual support (English/Arabic) and a powerful admin panel.

## Features

### Customer-Facing Website
- 🏠 **Home Page** with slider banner, top sellers, random products, and special offers
- 📦 **Product Categories**: Electronics, Personal Care, Home Supplies, Accessories, Gifts
- 🔍 **Product Details Page** with multiple images, description, pricing, and stock information
- 🛒 **Shopping Cart** with quantity management
- ✅ **Checkout Process** with delivery information
- ❤️ **Favorites** system
- 🌐 **Bilingual Support** (English & Arabic with RTL support)
- 🎨 **Black & White Theme** with elegant design
- 📱 **Responsive Design** for all devices

### Admin Panel
- 📊 **Dashboard** with key statistics
- 📦 **Product Management**: Add, edit, delete, show/hide products
- 📁 **Category Management**: Create and manage categories
- 🛒 **Order Management**: View orders, update status
- 📈 **Reports**: Export orders by date range to CSV
- 🎯 **Full Control** over all items and inventory

### Technical Features
- 💾 **MySQL Database** with proper schema
- 🔐 **JWT Authentication** for admin access
- 🌐 **RESTful API** built with Node.js and Express
- 💳 **Payment Ready** (Cash on Delivery now, e-payment integration ready)
- 📊 **Real-time Stock Management**

## Project Structure

```
kiwi-ecommerce/
├── frontend/               # Customer-facing website
│   ├── index.html         # Home page
│   ├── product.html       # Product details
│   ├── cart.html          # Shopping cart
│   ├── checkout.html      # Checkout page
│   ├── styles.css         # Main styles
│   ├── app.js             # Main JavaScript
│   └── ...
├── admin/                 # Admin panel
│   ├── index.html         # Admin dashboard
│   ├── admin-styles.css   # Admin styles
│   └── admin.js           # Admin functionality
├── backend/               # Node.js API server
│   ├── server.js          # Express server
│   ├── package.json       # Dependencies
│   └── .env.example       # Environment variables template
└── database/              # Database schema
    └── schema.sql         # MySQL database structure
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- Web browser

### Step 1: Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE kiwi_ecommerce;
```

2. Import the schema:
```bash
mysql -u root -p primejo_ecommerce < database/schema.sql
```

### Step 2: Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Edit `.env` file with your database credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kiwi_ecommerce
JWT_SECRET=your_secret_key
```

5. Start the server:
```bash
npm start
```

The API will run on `http://localhost:3000`

### Step 3: Frontend Setup

#### Option 1: Simple HTTP Server (for testing)
```bash
cd frontend
python -m http.server 8080
```
Or use any simple HTTP server of your choice.

#### Option 2: Direct File Access
Open `frontend/index.html` directly in your browser.

**Note**: The frontend currently uses localStorage for demo purposes. To connect to the backend API, you'll need to update the JavaScript files to make API calls instead of using localStorage.

### Step 4: Admin Panel Access

1. Open `admin/index.html` in your browser
2. Default credentials (if using the backend):
   - Email: admin@primejo.strore
   - Password: (set in database)

## Usage Guide

### For Customers

1. **Browse Products**: Navigate through categories or view featured items on the home page
2. **View Product Details**: Click on any product to see full details, pricing, and stock availability
3. **Add to Cart**: Select quantity and add items to your shopping cart
4. **Checkout**: Proceed to checkout, enter delivery information, and confirm your order
5. **Language Switch**: Use the language toggle in the top-right to switch between English and Arabic

### For Administrators

1. **Dashboard**: View key statistics (total products, orders, revenue)
2. **Manage Products**:
   - Click "Add New Product" to create products
   - Fill in bilingual names and descriptions
   - Set prices, stock, and category
   - Upload images (URLs)
   - Mark as top seller or special offer
   - Show/hide products
3. **Manage Categories**: Add or remove product categories
4. **Process Orders**:
   - View all orders
   - See customer details and delivery information
   - Update order status (Pending → Completed/Cancelled)
5. **Export Reports**: Filter orders by date and export to CSV

## API Endpoints

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders (admin)
- `GET /api/orders/:id` - Get order details (admin)
- `PATCH /api/orders/:id/status` - Update order status (admin)

### Stats
- `GET /api/stats` - Get dashboard statistics (admin)

## Database Schema

### Tables
1. **categories** - Product categories
2. **products** - Product catalog with bilingual support
3. **users** - Customer and admin accounts
4. **orders** - Customer orders
5. **order_items** - Individual items in each order
6. **favorites** - User favorite products

See `database/schema.sql` for complete table structures.

## Customization

### Changing Colors
Edit the CSS variables in `frontend/styles.css` and `admin/admin-styles.css`:
```css
:root {
    --primary-black: #000000;
    --primary-white: #FFFFFF;
    --grey-light: #F5F5F5;
    /* Add your custom colors */
}
```

### Adding Payment Gateway
The platform is ready for e-payment integration:
1. Add payment gateway credentials to `.env`
2. Implement payment processing in `backend/server.js`
3. Update checkout form in `frontend/checkout.html`

### Adding Email Notifications
Configure email settings in `.env` and implement using nodemailer:
```javascript
const nodemailer = require('nodemailer');
// Configure and send emails on order creation
```

## Demo Data

The platform comes with sample products in the localStorage. For production:
1. Remove sample data from `frontend/app.js`
2. Connect frontend to backend API
3. Add real products through admin panel

## Security Notes

⚠️ **Important for Production:**
- Change all default passwords
- Use strong JWT secret
- Enable HTTPS
- Implement rate limiting
- Add input validation
- Sanitize user inputs
- Use prepared statements (already implemented)
- Hash passwords properly (bcrypt already included)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Technologies Used

### Frontend
- HTML5
- CSS3 (with custom properties)
- Vanilla JavaScript
- Google Fonts (Playfair Display, Work Sans)

### Backend
- Node.js
- Express.js
- MySQL
- JWT for authentication
- Bcrypt for password hashing

## Future Enhancements

- [ ] Online payment gateway integration
- [ ] User authentication and accounts
- [ ] Product reviews and ratings
- [ ] Advanced search and filters
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Inventory alerts
- [ ] Sales analytics
- [ ] Coupon/discount system
- [ ] Wishlist sharing

## Support

For issues or questions, contact: info@primejo.store

## License

MIT License - feel free to use this project for commercial purposes.

---

**Built with ❤️ for primeJO E-Commerce**
