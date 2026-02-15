# 🎯 Admin Quick Reference Card

## 🚀 First Time Setup (5 Minutes)

### Step 1: Add Categories
```
Admin Panel → Categories → Add Category

Required Categories (minimum 3-5):
1. electronics
2. fashion  
3. home-supplies
4. personal-care
5. accessories
```

### Step 2: Add Products
```
Admin Panel → Products → Add New Product

For each product:
1. Names (EN & AR)
2. Description (EN & AR)
3. Select category
4. Set prices & stock
5. Add image URL from ImgBB.com
6. Check "Visible"
7. Save
```

---

## 📊 Admin Panel Overview

```
┌─────────────────────────────────────────────┐
│  KIWI ADMIN                                 │
├─────────────────────────────────────────────┤
│  📊 Dashboard  ← Stats & overview          │
│  📦 Products   ← Manage products           │
│  📁 Categories ← Manage categories         │
│  🛒 Orders     ← View & process orders    │
│  📈 Reports    ← Export & analytics       │
└─────────────────────────────────────────────┘
```

---

## 📁 CATEGORIES

### Add Category
```
Button: + Add Category
Fields:
  - ID: lowercase-with-hyphens
  - Name (EN): Display name
  - Name (AR): Arabic name
```

### Delete Category
```
Note: Remove/move products first!
Button: Delete (in category row)
```

### Category Examples
```
✅ electronics      ❌ Electronics
✅ home-supplies    ❌ home supplies
✅ personal-care    ❌ personal_care
```

---

## 📦 PRODUCTS

### Add Product - Required Fields
```
✓ Name (English)
✓ Name (Arabic)
✓ Description (English)
✓ Description (Arabic)
✓ Category (dropdown)
✓ Stock quantity
✓ Old price
✓ New price
✓ Main image URL
```

### Add Product - Optional Fields
```
○ Additional images (comma-separated URLs)
○ Video URL (YouTube/Vimeo/Direct)
□ Top Seller (checkbox)
□ Special Offer (checkbox)
□ Visible (checkbox - should be checked!)
```

### Image URLs
```
Upload to: ImgBB.com (free)
Format: https://i.ibb.co/ABC123/product.jpg
Test: Click "Preview Image" before saving
```

### Product Status Flags
```
☑ Top Seller → Shows in "Top Sellers" section
☑ Special Offer → Shows in "Offers" section
☑ Visible → Shows on website (must be checked!)
```

---

## 🛒 ORDERS

### View Order
```
Click: "View" button on order row
Shows:
  - Customer details
  - Delivery address
  - Order items
  - Total amount
  - Payment method
  - Currency used
```

### Update Order Status
```
Dropdown: Change Status
Options:
  - Pending (new orders)
  - Completed (fulfilled)
  - Cancelled (cancelled)

Select new status → Auto-saves
```

### Order Information
```
Order ID: ORD-1234567890
Customer: John Doe
Phone: +123456789
Address: City, Street, Building, Floor
Items: 3 items
Total: $299.99 (JOD)
Status: Pending
Date: 2024-02-02
```

---

## 📈 REPORTS

### Export Orders
```
1. Select date range (optional)
   - From Date: 2024-01-01
   - To Date: 2024-12-31
2. Click: "Export Orders to CSV"
3. File downloads automatically
4. Open in Excel/Google Sheets
```

### Report Contents
```
CSV includes:
- Order ID
- Customer name
- Phone number
- Address
- Items count
- Total amount
- Status
- Order date
```

---

## 🎯 Daily Operations

### Morning Routine
```
1. Check Dashboard → Review stats
2. Check Orders → Process pending orders
3. Update order statuses
4. Respond to any issues
```

### Adding New Products
```
1. Upload images to ImgBB
2. Products → Add New Product
3. Fill all fields
4. Preview images/video
5. Save product
6. Verify on website
```

### Processing Orders
```
1. Orders → View pending
2. Click "View" on order
3. Note customer details
4. Prepare items
5. Update status to "Completed"
6. Customer notified (manual for now)
```

---

## ⚠️ Important Rules

### Categories
```
✓ Add categories BEFORE products
✓ Use lowercase IDs
✓ No spaces in IDs (use hyphens)
✓ Can't delete category with products
```

### Products
```
✓ MUST select existing category
✓ MUST check "Visible" to show on website
✓ MUST use HTTPS image URLs
✓ Test image with "Preview" before saving
✓ Stock = 0 shows "Out of Stock"
```

### Images
```
✓ Use ImgBB.com or similar
✓ Get "Direct link" URL
✓ Format: https://i.ibb.co/...
✓ Size: ~800x800px, under 500KB
✓ Test URL in browser first
```

---

## 🔍 Troubleshooting

### Product not showing on website?
```
Check:
□ Product marked "Visible" ✓
□ Category exists
□ Image URL is valid (HTTPS)
□ Browser refreshed (Ctrl+F5)
```

### Category dropdown empty?
```
Solution:
1. Go to Categories section
2. Add at least one category
3. Refresh page
4. Try adding product again
```

### Image not loading?
```
Check:
□ URL uses HTTPS (not HTTP)
□ URL is direct image link
□ Image is publicly accessible
□ Test URL in browser tab
```

### Can't delete category?
```
Reason: Products exist in category
Solution:
1. Move products to other categories
2. OR delete products first
3. Then delete empty category
```

---

## 💾 Data Management

### Backup Data
```
Products & Categories stored in browser:
localStorage.getItem('products')
localStorage.getItem('categories')
localStorage.getItem('orders')

To backup: Use browser developer tools
Or: Implement export feature
```

### Clear All Data (Careful!)
```
localStorage.clear() ← Removes everything!
Only do this to start completely fresh
```

---

## 📋 Checklists

### New Product Checklist
```
□ Category exists for product
□ Product images uploaded to ImgBB
□ Image URLs copied
□ English name & description written
□ Arabic name & description written
□ Prices set correctly
□ Stock quantity set
□ Image URL pasted
□ Preview clicked ✓
□ "Visible" checked ✓
□ Product saved
□ Verified on website
```

### Daily Admin Checklist
```
□ Check new orders
□ Process pending orders
□ Update order statuses
□ Check stock levels
□ Add new products if needed
□ Review customer feedback
```

### Weekly Admin Checklist
```
□ Export orders report
□ Analyze sales data
□ Update product prices if needed
□ Add new categories if needed
□ Check low stock items
□ Update product descriptions
```

---

## 🎓 Pro Tips

1. **Start Small**: 3 categories, 10 products
2. **Test Everything**: Preview images before saving
3. **Be Consistent**: Use same image sizes
4. **Check Daily**: Process orders promptly
5. **Backup Regularly**: Export data weekly
6. **Monitor Stock**: Update quantities often
7. **Use "Top Seller"**: Highlight best products
8. **Mark Sales**: Use "Special Offer" for discounts

---

## 📞 Quick Help

**Issue**: Can't add product
**Fix**: Add categories first!

**Issue**: Product not visible
**Fix**: Check "Visible" checkbox ✓

**Issue**: Image not showing
**Fix**: Use HTTPS, preview first

**Issue**: Category dropdown empty
**Fix**: Add at least one category

---

## 🚀 Launch Checklist

Before going live:
```
□ 5+ categories added
□ 15+ products added
□ All products have images
□ All images load correctly
□ Prices are correct
□ Stock quantities set
□ Tested checkout process
□ Verified both languages work
□ Backed up data
□ Ready to launch! 🎉
```

---

**Keep this guide handy for quick reference!**

**Admin URL**: `admin/index.html`
**Main Site**: `frontend/index.html`
