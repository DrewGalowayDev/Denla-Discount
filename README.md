# 🏪 Denla Discount - POS & Inventory Management System

A comprehensive Point of Sale (POS) and Inventory Management System built for retail stores, supermarkets, and discount shops.

---

## 🎯 Features

### 💼 Core Functionality
- ✅ **Point of Sale (POS)** - Fast checkout with barcode scanning
- ✅ **Inventory Management** - Real-time stock tracking
- ✅ **Supplier Management** - Vendor relationships and purchase orders
- ✅ **Product Management** - SKU, barcode, pricing tiers
- ✅ **Multi-User System** - Admin, Manager, Cashier, Inventory Clerk roles
- ✅ **Cash Register** - Daily opening/closing with reconciliation
- ✅ **Returns & Refunds** - Complete return processing
- ✅ **Batch Tracking** - Expiry date management
- ✅ **Stock Adjustments** - Damage, loss, returns tracking
- ✅ **Reports & Analytics** - Sales, inventory, and performance reports

### 📊 Analytics & Reporting
- Daily sales summaries
- Product sales analytics
- Low stock alerts
- Expiring products tracking
- Top-selling products
- Cashier performance
- Profit margins

### 💳 Payment Methods
- Cash
- Card (Credit/Debit)
- M-Pesa
- Bank Transfer
- Credit (for wholesale customers)
- Mixed payments

---

## 🚀 Quick Start

### Prerequisites
- **MySQL 8.0+** ([Download](https://dev.mysql.com/downloads/))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **npm 9+**

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/yourusername/denla-discount.git
cd denla-discount
```

#### 2. Install dependencies
```bash
npm install
cd backend
npm install
```

#### 3. Configure environment
```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials
```

#### 4. Setup database (One command!)
```bash
npm run db:setup
```

This will:
- ✅ Create `denla` database
- ✅ Create all 25 tables
- ✅ Seed sample data (suppliers, products, customers)
- ✅ Create admin and staff users

#### 5. Start the server
```bash
npm run dev
```

Server will start on: `http://localhost:5000`

---

## 🔐 Default Login Credentials

| Role | Email | Password | Employee ID |
|------|-------|----------|-------------|
| **Admin** | admin@denla.com | admin123 | EMP001 |
| Cashier | cashier1@denla.com | cashier123 | EMP002 |
| Manager | manager@denla.com | manager123 | EMP003 |
| Inventory Clerk | inventory@denla.com | inventory123 | EMP004 |

⚠️ **IMPORTANT:** Change these passwords immediately after first login!

---

## 📁 Project Structure

```
denla-discount/
├── backend/
│   ├── config/
│   │   └── database.js           # MySQL connection
│   ├── controllers/
│   │   ├── authController.js     # Authentication
│   │   ├── productController.js  # Products
│   │   ├── categoryController.js # Categories
│   │   ├── cartController.js     # Shopping cart
│   │   └── userController.js     # User management
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   └── errorHandler.js       # Error handling
│   ├── routes/
│   │   └── ...                   # API routes
│   ├── database/
│   │   ├── mysql-schema-pos.sql  # Database schema
│   │   ├── init-database.js      # Setup script
│   │   ├── seed-data.js          # Sample data
│   │   └── create-admin.js       # User creation
│   ├── utils/
│   │   └── dbHelpers.js          # Database utilities
│   ├── .env                      # Environment config
│   ├── package.json
│   └── server.js                 # Main server
├── api/                          # Serverless functions
├── public/                       # Frontend files
├── .gitignore
├── README.md
└── package.json
```

---

## 🗄️ Database Schema

### Tables (25 total)

**User Management**
- `users` - Staff/employees
- `user_sessions` - Login tracking

**Inventory**
- `products` - Product catalog
- `product_batches` - Expiry tracking
- `categories` - Product categories
- `suppliers` - Vendor information

**Purchasing**
- `purchase_orders` - Stock ordering
- `purchase_order_items` - PO details
- `stock_adjustments` - Stock movements

**Sales (POS)**
- `sales` - Transactions
- `sale_items` - Transaction details
- `sale_payments` - Payment tracking
- `customers` - Customer data

**Returns**
- `returns` - Return transactions
- `return_items` - Returned items

**Financial**
- `expenses` - Business expenses
- `cash_register` - Daily reconciliation

**Analytics**
- `daily_sales_summary`
- `product_sales_analytics`
- `audit_logs`
- `system_settings`

---

## 🛠️ API Endpoints

### Authentication
```
POST   /api/auth/login              # Login
POST   /api/auth/register           # Register new user
GET    /api/auth/me                 # Get current user
PUT    /api/auth/update-password    # Change password
```

### Products
```
GET    /api/products                # Get all products
GET    /api/products/:id            # Get single product
POST   /api/products                # Create product (Admin)
PUT    /api/products/:id            # Update product (Admin)
DELETE /api/products/:id            # Delete product (Admin)
GET    /api/products/search?q=...   # Search products
```

### Categories
```
GET    /api/categories              # Get all categories
POST   /api/categories              # Create category (Admin)
PUT    /api/categories/:id          # Update category
DELETE /api/categories/:id          # Delete category
```

### Sales (POS)
```
POST   /api/sales                   # Create sale transaction
GET    /api/sales                   # Get all sales
GET    /api/sales/:id               # Get sale details
POST   /api/sales/:id/refund        # Process refund
```

### Users
```
GET    /api/users/admin/all         # Get all users (Admin)
GET    /api/users/admin/:id         # Get user details
PUT    /api/users/admin/:id/deactivate  # Deactivate user
```

---

## 📊 Sample Data Included

- **3 Suppliers** with payment terms
- **18 Products** across 8 categories
- **4 Sample Customers** (including walk-in)
- **8 Product Categories** (Groceries, Beverages, Dairy, Bakery, etc.)
- **4 Staff Users** (Admin, Cashier, Manager, Inventory)

---

## 🔧 Configuration

### Environment Variables (`backend/.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# MySQL Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=denla
DB_PORT=3306

# JWT
JWT_SECRET=your_strong_secret_key
JWT_EXPIRE=7d

# Optional: M-Pesa (for mobile payments)
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
```

---

## 🧪 Testing

### Test API Endpoints

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@denla.com","password":"admin123"}'
```

**Get Products:**
```bash
curl http://localhost:5000/api/products
```

**Get Categories:**
```bash
curl http://localhost:5000/api/categories
```

---

## 📚 Documentation

- **Quick Start Guide:** `QUICK_START.md`
- **Migration Guide:** `MIGRATION_GUIDE.md`
- **Setup Summary:** `SETUP_SUMMARY.md`
- **API Migration:** `api/_API_MIGRATION_GUIDE.md`

---

## 🔐 Security

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Role-based access control
- ✅ Rate limiting
- ✅ SQL injection protection (parameterized queries)
- ✅ Audit logging
- ⚠️ Change default passwords!
- ⚠️ Use strong JWT_SECRET in production
- ⚠️ Enable HTTPS in production

---

## 🚀 Deployment

### Production Checklist
- [ ] Change all default passwords
- [ ] Update JWT_SECRET
- [ ] Enable HTTPS
- [ ] Configure firewall
- [ ] Set up database backups
- [ ] Configure monitoring
- [ ] Test all features
- [ ] Train staff

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🆘 Support

For issues, questions, or contributions:
- 📧 Email: support@denla.com
- 📱 WhatsApp: +254700000000
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/denla-discount/issues)

---

## 🙏 Acknowledgments

Built with:
- Node.js & Express
- MySQL
- JWT
- bcryptjs
- And many other open-source packages

---

## 📊 System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 10GB
- MySQL 8.0+
- Node.js 18+

**Recommended:**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 50GB+ SSD
- MySQL 8.0+
- Node.js 20+

---

**Made with ❤️ for small businesses and retail stores**

**Start your POS journey today! 🛒💰**
"# Denla-Discount" 
