# 🔄 Migration Guide: Supabase to MySQL (POS System)

## Overview
This guide covers the complete migration from Supabase (PostgreSQL) to MySQL for the **Point of Sale (POS) and Inventory Management System**.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Environment Configuration](#environment-configuration)
4. [Running Migration Scripts](#running-migration-scripts)
5. [Code Changes](#code-changes)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

### Required Software
- **MySQL Server 8.0+** (Download: https://dev.mysql.com/downloads/)
- **Node.js 18+**
- **npm 9+**

### Verify MySQL Installation
```bash
mysql --version
# Should output: mysql  Ver 8.0.x
```

### Verify MySQL is Running
```powershell
# Windows - Check service status
Get-Service -Name MySQL*

# Or connect to MySQL
mysql -u root -p
```

---

## 2. Database Setup

### Step 1: Install Dependencies
```bash
# In project root
npm install

# In backend folder
cd backend
npm install
```

### Step 2: Configure Environment Variables
Copy and configure the environment file:
```bash
# Backend directory
cp .env.example .env
```

Edit `backend/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Hackifyoucan254
DB_NAME=denla
DB_PORT=3306
```

### Step 3: Initialize Database
This script will:
- Create the `denla` database
- Create all tables
- Set up triggers and views

```bash
cd backend
npm run db:init
```

**Expected Output:**
```
✅ Database "denla" created successfully
✅ Schema executed successfully
✅ Created 25+ tables
```

### Step 4: Seed Sample Data
This populates the database with test data:

```bash
npm run db:seed
```

**What gets seeded:**
- 3 Suppliers
- 18 Products (across multiple categories)
- 4 Sample Customers
- 8 Categories (pre-created)

### Step 5: Create Admin Users
```bash
npm run db:admin
```

**Default Credentials:**
| Role | Email | Password | Employee ID |
|------|-------|----------|-------------|
| Admin | admin@denla.com | admin123 | EMP001 |
| Cashier | cashier1@denla.com | cashier123 | EMP002 |
| Manager | manager@denla.com | manager123 | EMP003 |
| Inventory | inventory@denla.com | inventory123 | EMP004 |

⚠️ **IMPORTANT:** Change these passwords immediately after first login!

### All-in-One Setup
Run all setup commands at once:
```bash
npm run db:setup
```

---

## 3. Environment Configuration

### Backend Configuration (`backend/.env`)
```env
# Server
PORT=5000
NODE_ENV=development

# MySQL Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Hackifyoucan254
DB_NAME=denla
DB_PORT=3306
DB_CONNECTION_LIMIT=10

# JWT
JWT_SECRET=your_strong_secret_here
JWT_EXPIRE=7d

# Optional: M-Pesa (for mobile payments)
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_ENVIRONMENT=sandbox
```

### API Configuration (`api/_utils/database.js`)
The API serverless functions use the same environment variables.

---

## 4. Running Migration Scripts

### Manual MySQL Commands (Alternative)
If scripts don't work, run SQL manually:

```bash
# Connect to MySQL
mysql -u root -p

# Enter password: Hackifyoucan254

# Create database
CREATE DATABASE denla CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Use database
USE denla;

# Run schema file
SOURCE D:/Drew Files/Awesome/backend/database/mysql-schema-pos.sql;

# Verify tables
SHOW TABLES;
```

---

## 5. Code Changes

### What Was Changed?

#### ✅ Database Layer
- **Removed:** `@supabase/supabase-js`
- **Added:** `mysql2` connection pooling
- **Created:** `backend/config/database.js`
- **Created:** `backend/utils/dbHelpers.js`
- **Created:** `api/_utils/database.js`

#### ✅ Controllers (Updated)
- `authController.js` - User authentication
- `productController.js` - Product management
- `categoryController.js` - Category CRUD
- `cartController.js` - Shopping cart
- `userController.js` - User management

#### ✅ Middleware
- `auth.js` - JWT authentication with MySQL

#### ⏳ Pending Controllers (Need Manual Update)
- `orderController.js`
- `reviewController.js`
- `wishlistController.js`
- `paymentController.js`

### Query Pattern Changes

**Before (Supabase):**
```javascript
const { data, error } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('id', productId)
    .single();
```

**After (MySQL):**
```javascript
const product = await queryOne(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
`, [productId]);
```

---

## 6. Testing

### Test Database Connection
```bash
cd backend
node -e "require('./config/database').testConnection()"
```

### Test Server Startup
```bash
npm run dev
```

**Expected Output:**
```
✅ MySQL Database connected successfully
📊 Database: denla
🌐 Host: localhost:3306
🚀 Server running in development mode on port 5000
```

### Test API Endpoints

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@denla.com\",\"password\":\"admin123\"}"
```

#### Get Products
```bash
curl http://localhost:5000/api/products
```

#### Get Categories
```bash
curl http://localhost:5000/api/categories
```

---

## 7. Troubleshooting

### Issue: "Cannot connect to MySQL"
**Solutions:**
1. Verify MySQL service is running
2. Check credentials in `.env`
3. Test connection:
   ```bash
   mysql -u root -p -h localhost
   ```

### Issue: "Database 'denla' doesn't exist"
**Solution:**
```bash
npm run db:init
```

### Issue: "ER_ACCESS_DENIED_ERROR"
**Solutions:**
1. Verify password in `.env` matches MySQL root password
2. Grant privileges:
   ```sql
   GRANT ALL PRIVILEGES ON denla.* TO 'root'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Issue: "Table doesn't exist"
**Solution:**
Re-run schema:
```bash
mysql -u root -p denla < backend/database/mysql-schema-pos.sql
```

### Issue: "Cannot find module 'mysql2'"
**Solution:**
```bash
cd backend
npm install mysql2
```

### Issue: "Port 3306 already in use"
**Check if MySQL is running on different port:**
```bash
netstat -an | findstr :3306
```

---

## 📊 Database Schema Overview

### Core Tables (25 total)

**User Management:**
- `users` - Staff/employees
- `user_sessions` - Login tracking

**Inventory:**
- `products` - Product catalog
- `product_batches` - Batch tracking with expiry
- `categories` - Product categories
- `suppliers` - Supplier information

**Purchasing:**
- `purchase_orders` - Stock ordering
- `purchase_order_items` - PO line items
- `stock_adjustments` - Stock movements

**Sales (POS):**
- `sales` - Transactions
- `sale_items` - Transaction line items
- `sale_payments` - Payment details
- `customers` - Customer information

**Returns:**
- `returns` - Return transactions
- `return_items` - Returned items

**Financial:**
- `expenses` - Business expenses
- `cash_register` - Daily cash management

**Analytics:**
- `daily_sales_summary`
- `product_sales_analytics`
- `audit_logs`

**Configuration:**
- `system_settings`

---

## 🔐 Security Checklist

- [ ] Change default admin password
- [ ] Change default user passwords
- [ ] Update `JWT_SECRET` in `.env`
- [ ] Restrict MySQL access to localhost only
- [ ] Enable MySQL firewall rules
- [ ] Set up regular database backups
- [ ] Review and restrict user permissions

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review error logs in `console`
3. Check MySQL error logs
4. Verify all environment variables are set correctly

---

## ✅ Migration Checklist

- [ ] MySQL installed and running
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] Database initialized (`npm run db:init`)
- [ ] Sample data seeded (`npm run db:seed`)
- [ ] Admin user created (`npm run db:admin`)
- [ ] Server starts without errors (`npm run dev`)
- [ ] API endpoints tested and working
- [ ] Login functionality verified
- [ ] Default passwords changed

---

**🎉 Congratulations! Your POS system is ready to use!**

Next: Start the server and begin customizing for your specific needs.
