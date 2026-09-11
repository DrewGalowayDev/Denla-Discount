# Denla Discount POS - Frontend Setup

## 🎨 Color Scheme

The POS system uses a modern, vibrant color scheme:

- **Primary Color**: Orange (`#FF6B35`, `#FF8C42`)
- **Secondary Color**: Sky Blue (`#87CEEB`, `#4A90E2`)
- **Neutral Colors**: White (`#FFFFFF`), Light Gray (`#F5F5F5`)
- **Success**: Green (`#28a745`)
- **Danger**: Red (`#DC3545`)
- **Warning**: Yellow (`#FFC107`)

## 📁 Frontend Files

### Main Pages

1. **login.html** - User authentication page
   - Orange gradient left panel with features
   - Sky blue gradient background
   - Clean white login form
   - Default credentials: `admin@denla.com` / `admin123`

2. **pos.html** - Main POS cashier interface
   - Product browsing and search
   - Barcode scanning support
   - Shopping cart management
   - Quick checkout with multiple payment methods
   - Real-time stock display

3. **dashboard.html** - Management dashboard (Coming soon)
   - Sales analytics
   - Inventory overview
   - User management
   - Reports

### JavaScript Files

1. **js/pos.js** - POS functionality
   - Product loading and filtering
   - Cart management
   - Payment processing
   - Receipt generation

## 🚀 Getting Started

### Prerequisites

- Backend server running on `http://localhost:5000`
- MySQL database with seeded data
- Modern web browser (Chrome, Firefox, Edge)

### Running the Frontend

1. Open any HTML file in a web browser:
   ```
   - Using Live Server (VS Code extension)
   - Or simply double-click the HTML file
   ```

2. Login with default credentials:
   ```
   Email: admin@denla.com
   Password: admin123
   ```

   Or other test accounts:
   ```
   cashier1@denla.com / cashier123
   manager@denla.com / manager123
   inventory@denla.com / inventory123
   ```

## 🛠️ Features

### Login Page
- ✅ Clean, modern design
- ✅ Orange/Sky Blue color scheme
- ✅ Input validation
- ✅ Remember me option
- ✅ Role-based redirection

### POS Interface
- ✅ Product search by name, SKU, or barcode
- ✅ Category filtering
- ✅ Real-time stock display
- ✅ Shopping cart with quantity controls
- ✅ Tax calculation (16% VAT)
- ✅ Multiple payment methods:
  - Cash (with change calculation)
  - Card
  - M-Pesa
  - Bank Transfer
- ✅ Sale receipt generation
- ✅ Customer selection

### Upcoming Features
- 📋 Dashboard with analytics
- 📦 Inventory management page
- 👥 Customer management
- 📊 Sales reports
- ⚙️ Settings page
- 🖨️ Receipt printing

## 🎯 User Roles

1. **Admin** - Full access to all features
2. **Manager** - Sales reports, inventory, user management
3. **Cashier** - POS interface only
4. **Inventory Manager** - Product and stock management

## 📱 Responsive Design

The interface is built with Bootstrap 5 and is fully responsive:
- Desktop: Full split-screen POS layout
- Tablet: Stacked layout with collapsible sections
- Mobile: Single-column mobile-optimized view

## 🔧 Customization

### Changing Colors

All colors are defined in the `<style>` section of each HTML file. Key color variables:

```css
/* Primary Orange */
#FF6B35, #FF8C42

/* Sky Blue */
#87CEEB, #4A90E2

/* Success Green */
#28a745

/* Danger Red */
#DC3545
```

### Adding New Payment Methods

Edit `pos.html` payment methods section and update `pos.js` payment logic.

## 📝 API Integration

The frontend connects to these API endpoints:

- `POST /api/auth/login` - User authentication
- `GET /api/products` - Fetch products
- `POST /api/sales` - Create sale transaction
- `GET /api/sales` - Fetch sales history
- `GET /api/categories` - Fetch categories

## 🐛 Troubleshooting

### Common Issues

1. **CORS errors**
   - Ensure backend server allows `http://localhost:5500` and `http://127.0.0.1:5500`
   - Check backend CORS configuration in `server.js`

2. **API connection failed**
   - Verify backend server is running on port 5000
   - Check `API_URL` in JavaScript files

3. **Login fails**
   - Ensure database is seeded with user accounts
   - Check browser console for error messages

4. **Products not loading**
   - Verify products exist in database
   - Check authentication token in localStorage

## 📞 Support

For issues or questions:
- Check the browser console for errors
- Verify backend API is responding at `http://localhost:5000/health`
- Ensure MySQL database is running and populated

---

**Built with Bootstrap 5 and modern JavaScript (ES6+)**
