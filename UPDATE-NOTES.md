# Kiwi E-Commerce - Updates & New Features

## 🎉 What's New

### 1. Multi-Currency Support
**Location**: All frontend pages

Customers can now choose their preferred currency from:
- USD ($) - US Dollar
- EUR (€) - Euro
- GBP (£) - British Pound
- JOD - Jordanian Dinar
- AED - UAE Dirham
- SAR - Saudi Riyal

**Features:**
- Currency selector in top-right corner (next to language toggle)
- All prices automatically convert based on selected currency
- Currency preference is saved and remembered
- Order records include currency information

**For Developers:**
- Update exchange rates in `frontend/app.js` (currencyRates object)
- Or integrate with a live exchange rate API

### 2. Enhanced Delivery Address
**Location**: Checkout page

Customers now provide detailed address information:
- **City** - Customer's city
- **Street** - Street name
- **Building Number** - Building/house number
- **Floor/Apartment** - Optional floor or apartment number
- **Additional Details** - Landmarks, special instructions

**Benefits:**
- More accurate deliveries
- Better organization for delivery personnel
- Complete address stored in database

### 3. Admin Image & Video Preview
**Location**: Admin Panel → Products

Admins can now preview all media before saving:

**Features:**
- **Main Image Preview** - See the main product image
- **Multiple Additional Images** - Preview all gallery images at once
- **Video Preview** - Watch product videos before saving
  - Supports YouTube URLs
  - Supports Vimeo URLs
  - Supports direct video file links

**How to Use:**
1. Enter image/video URL
2. Click "Preview" button
3. View media in preview section
4. Make corrections if needed
5. Save product when satisfied

**Supported Video Formats:**
- YouTube: `https://youtube.com/watch?v=...`
- Vimeo: `https://vimeo.com/...`
- Direct MP4: `https://example.com/video.mp4`

---

## 📋 Implementation Details

### Currency System

**File**: `frontend/app.js`

```javascript
// Currency rates (update regularly)
const currencyRates = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JOD: 0.71,
    AED: 3.67,
    SAR: 3.75
};

// Format prices with currency
function formatPrice(price) {
    const converted = price * currencyRates[currentCurrency];
    return `${currencySymbols[currentCurrency]}${converted.toFixed(2)}`;
}
```

**Updated Files:**
- `frontend/index.html` - Added currency selector
- `frontend/styles.css` - Currency selector styles
- `frontend/app.js` - Currency logic
- `frontend/cart-page.js` - Cart prices
- `frontend/checkout.js` - Checkout total
- `frontend/product.js` - Product detail prices

### Address Fields

**Updated Files:**
- `frontend/checkout.html` - New address form fields
- `frontend/checkout.js` - Save detailed address
- `admin/admin.js` - Display detailed address in orders

**Database Changes:**
New columns in `orders` table:
- `delivery_city` VARCHAR(100)
- `delivery_street` VARCHAR(200)
- `delivery_building` VARCHAR(50)
- `delivery_floor` VARCHAR(50)
- `currency` VARCHAR(10)
- `currency_rate` DECIMAL(10, 4)

### Media Preview System

**Updated Files:**
- `admin/index.html` - Preview UI
- `admin/admin.js` - Preview functions

**New Functions:**
- `previewMainImage()` - Preview main product image
- `previewAdditionalImages()` - Preview image gallery
- `previewVideo()` - Preview product video

**Database Changes:**
Updated `products` table:
- `additional_images` TEXT - Store multiple image URLs
- `video_url` VARCHAR(500) - Store video URL

---

## 🔄 Migration Guide

### For Existing Installations:

#### 1. Update Database Schema

Run these SQL commands:

```sql
-- Update orders table
ALTER TABLE orders 
ADD COLUMN delivery_city VARCHAR(100) AFTER customer_email,
ADD COLUMN delivery_street VARCHAR(200) AFTER delivery_city,
ADD COLUMN delivery_building VARCHAR(50) AFTER delivery_street,
ADD COLUMN delivery_floor VARCHAR(50) AFTER delivery_building,
ADD COLUMN currency VARCHAR(10) DEFAULT 'USD' AFTER order_status,
ADD COLUMN currency_rate DECIMAL(10, 4) DEFAULT 1.0000 AFTER currency;

-- Update delivery_address to be nullable
ALTER TABLE orders MODIFY COLUMN delivery_address TEXT NULL;

-- Products table already has additional_images and video_url
-- If not, add them:
ALTER TABLE products 
ADD COLUMN additional_images TEXT AFTER image_url,
ADD COLUMN video_url VARCHAR(500) AFTER additional_images;
```

#### 2. Update Frontend Files

Replace these files from the new archive:
- `frontend/index.html`
- `frontend/styles.css`
- `frontend/app.js`
- `frontend/cart-page.js`
- `frontend/checkout.html`
- `frontend/checkout.js`
- `frontend/product.js`

#### 3. Update Admin Files

Replace these files:
- `admin/index.html`
- `admin/admin.js`

#### 4. Update Other Pages

Add currency selector to all pages:
- `product.html`
- `cart.html`
- `checkout.html`
- `category.html`
- `favorites.html`

Copy the currency HTML from `index.html`:
```html
<div class="currency-toggle">
    <select id="currencySelector" onchange="changeCurrency(this.value)">
        <option value="USD">$ USD</option>
        <option value="EUR">€ EUR</option>
        <option value="GBP">£ GBP</option>
        <option value="JOD">JOD دينار</option>
        <option value="AED">AED د.إ</option>
        <option value="SAR">SAR ر.س</option>
    </select>
</div>
```

---

## 🎯 Usage Examples

### For Customers:

**Changing Currency:**
1. Look at top-right corner
2. Click currency dropdown
3. Select preferred currency
4. All prices update instantly
5. Selection is saved

**Entering Delivery Address:**
1. Proceed to checkout
2. Fill in personal info
3. Enter detailed address:
   - City: Amman
   - Street: King Abdullah Street
   - Building: 15
   - Floor: 3rd Floor, Apt 302
   - Details: Near City Mall
4. Complete order

### For Admins:

**Adding Product with Media:**
1. Go to Products section
2. Click "Add New Product"
3. Fill in product details
4. **Main Image:**
   - Paste image URL
   - Click "Preview Image"
   - Verify it looks correct
5. **Additional Images:**
   - Enter multiple URLs (comma-separated)
   - Click "Preview Images"
   - See all images in grid
6. **Product Video:**
   - Paste YouTube/Vimeo link
   - Click "Preview Video"
   - Watch video to verify
7. Save product

**Viewing Order Address:**
1. Go to Orders section
2. Click "View" on any order
3. See detailed address:
   - City, Street, Building
   - Floor/Apartment
   - Additional details
   - Currency used

---

## 💡 Tips & Best Practices

### Currency Management:

**Update Exchange Rates:**
```javascript
// Edit frontend/app.js
const currencyRates = {
    USD: 1,
    EUR: 0.92,  // Update these regularly
    GBP: 0.79,
    JOD: 0.71,
    AED: 3.67,
    SAR: 3.75
};
```

**Or Use Live API:**
```javascript
// Example: Fetch live rates
async function updateCurrencyRates() {
    const response = await fetch('https://api.exchangerate.com/latest');
    const data = await response.json();
    currencyRates.EUR = data.rates.EUR;
    // Update other currencies
}
```

### Image URLs:

**Best Practices:**
- Use CDN for faster loading
- Optimize images (compress, resize)
- Use consistent image sizes
- Test URLs before saving
- Use HTTPS URLs

**Recommended Services:**
- Cloudinary
- ImgBB
- Imgur
- Your own server

### Video URLs:

**Supported Formats:**
```
YouTube:
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID

Vimeo:
https://vimeo.com/VIDEO_ID

Direct:
https://yourserver.com/video.mp4
```

---

## 🐛 Troubleshooting

### Currency not showing:
**Check:**
1. Currency selector is in HTML
2. `app.js` includes currency functions
3. Browser console for errors
4. Clear cache and reload

### Prices not converting:
**Check:**
1. `formatPrice()` function is defined
2. `currencyRates` object exists
3. Selected currency is valid
4. Console for JavaScript errors

### Address fields not saving:
**Check:**
1. Database columns exist
2. Form field IDs match JavaScript
3. Required fields are filled
4. Console for validation errors

### Image preview not working:
**Check:**
1. Image URL is valid (HTTPS)
2. Image is publicly accessible
3. No CORS issues
4. Image format is supported (JPG, PNG, GIF)

### Video preview not showing:
**Check:**
1. Video URL format is correct
2. YouTube/Vimeo video is public
3. Embed permissions are enabled
4. Console for iframe errors

---

## 📊 Database Updates Summary

### Orders Table:
```
New Columns:
- delivery_city
- delivery_street  
- delivery_building
- delivery_floor
- currency
- currency_rate

Modified:
- delivery_address (now optional)
```

### Products Table:
```
Existing (no changes needed):
- additional_images
- video_url
```

---

## 🚀 Future Enhancements

### Possible Additions:

1. **Live Currency API** - Real-time exchange rates
2. **Image Upload** - Direct file upload instead of URLs
3. **Video Upload** - Host videos on your server
4. **Address Autocomplete** - Google Places API integration
5. **Multiple Languages** - Add more language options
6. **Currency Converter** - Show prices in multiple currencies
7. **Delivery Zones** - Calculate shipping by address
8. **Image Gallery** - Carousel/lightbox for product images

---

## 📞 Support

If you encounter any issues with the new features:

1. Check this update guide
2. Review console errors (F12)
3. Verify database updates
4. Clear browser cache
5. Test in different browser

---

**Version**: 2.0
**Last Updated**: February 2024
**Compatibility**: All modern browsers
