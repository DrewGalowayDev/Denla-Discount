# 🚀 Quick Start Guide - POS System

## 1. Install MySQL
Download and install MySQL 8.0+ from: https://dev.mysql.com/downloads/

**Windows:** Use MySQL Installer
**Mac:** Use Homebrew: `brew install mysql`

## 2. Clone & Install Dependencies
```bash
cd "d:\Drew Files\Awesome"
npm install
cd backend
npm install
```

## 3. One-Command Setup
```bash
cd backend
npm run db:setup
```

This will:
✅ Create `denla` database
✅ Create all tables (25 tables)
✅ Seed sample data (suppliers, products, customers)
✅ Create admin and staff users

## 4. Start the Server
```bash
npm run dev
```

## 5. Login
Open your browser/Postman and login:

**Admin:**
- Email: `admin@denla.com`
- Password: `admin123`

**Other Users:**
- Cashier: `cashier1@denla.com` / `cashier123`
- Manager: `manager@denla.com` / `manager123`
- Inventory: `inventory@denla.com` / `inventory123`

## 6. Test API
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@denla.com\",\"password\":\"admin123\"}"

# Get products
curl http://localhost:5000/api/products

# Get categories
curl http://localhost:5000/api/categories
```

## Database Credentials
```
Host: localhost
Port: 3306
Database: denla
User: root
Password: Hackifyoucan254
```

## 🎯 What's Included?

### Sample Data
- **3 Suppliers** (Fresh Foods, Dairy Producers, Beverage Distributors)
- **18 Products** (Groceries, Beverages, Dairy, Bakery, Household, Personal Care)
- **8 Categories** (Pre-configured)
- **4 Customers** (Walk-in + 3 sample customers)
- **4 Staff Users** (Admin, Cashier, Manager, Inventory Clerk)

### Features Ready
- ✅ User authentication (JWT)
- ✅ Product management
- ✅ Category management
- ✅ Supplier management
- ✅ Inventory tracking
- ✅ Stock adjustments
- ✅ Purchase orders
- ✅ Point of Sale (POS)
- ✅ Returns & refunds
- ✅ Cash register
- ✅ Reports & analytics

## Manual Setup (Alternative)

If `npm run db:setup` doesn't work:

### Step 1: Create Database
```bash
mysql -u root -p
# Enter password: Hackifyoucan254

CREATE DATABASE denla CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE denla;
SOURCE d:/Drew Files/Awesome/backend/database/mysql-schema-pos.sql;
exit;
```

### Step 2: Seed Data
```bash
cd backend
node database/seed-data.js
```

### Step 3: Create Admin
```bash
node database/create-admin.js
```

## Troubleshooting

### MySQL not running?
```bash
# Windows
net start MySQL80

# Or use Services app (services.msc)
```

### Can't connect to MySQL?
1. Check MySQL is running
2. Verify password in `backend/.env`
3. Try: `mysql -u root -p`

### Tables not created?
```bash
mysql -u root -p denla < backend/database/mysql-schema-pos.sql
```

## Next Steps

1. ⚠️ **Change default passwords!**
2. Configure your shop name in system settings
3. Add your products
4. Add your suppliers
5. Start selling! 🛒

## Documentation

- **Full Migration Guide:** `MIGRATION_GUIDE.md`
- **API Documentation:** `api/_API_MIGRATION_GUIDE.md`
- **Controller Migration:** `backend/controllers/_MIGRATION_NOTE.md`

---

**Happy Selling! 🎉**
