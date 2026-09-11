# API Serverless Functions - MySQL Migration Guide

## ✅ Completed Utils
- `_utils/database.js` - MySQL connection pool and query helpers
- `_utils/auth.js` - Updated to use MySQL for user validation
- `_utils/cors.js` - No changes needed (CORS handling)

## 📋 Migration Pattern for API Functions

### Before (Supabase):
```javascript
const { supabase } = require('../_utils/supabase');

const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
```

### After (MySQL):
```javascript
const { query, queryOne } = require('../_utils/database');

const user = await queryOne(
    'SELECT * FROM users WHERE email = ?',
    [email]
);
```

## 🔄 API Functions to Migrate

### 1. `/api/auth/index.js` - Authentication
**Actions needed:**
- Replace all `supabase.from('users')` with MySQL queries
- Update login, signup, forgot-password, reset-password functions
- Pattern already shown in `backend/controllers/authController.js`

### 2. `/api/products.js` - Products API
**Actions needed:**
- Replace Supabase queries with MySQL
- Use JOINs for category data
- Reference: `backend/controllers/productController.js`

### 3. `/api/categories/index.js` - Categories
**Actions needed:**
- Simple CRUD operations
- Reference: `backend/controllers/categoryController.js`

### 4. `/api/orders/index.js` - Orders Management
**Actions needed:**
- Complex queries with JOINs (users, products, order_items)
- Use transactions for order creation
- Reference: `backend/controllers/orderController.js` (when migrated)

### 5. `/api/admin/index.js` - Admin Operations
**Actions needed:**
- Update all admin queries
- User management, analytics queries
- Reference: `backend/controllers/userController.js`

### 6. `/api/contact/index.js` - Contact Messages
**Actions needed:**
- Insert/select from `contact_messages` table
- Simple CRUD operations

### 7. `/api/activity/index.js` - Activity Tracking
**Actions needed:**
- Insert/query `user_activity` table
- Analytics queries

### 8. `/api/mpesa.js` - M-Pesa Integration
**Actions needed:**
- Use `mpesa_transactions` table
- Update transaction status queries

## 🛠️ Quick Migration Steps

### Step 1: Update imports
```javascript
// Old
const { supabase } = require('../_utils/supabase');

// New
const { query, queryOne, generateUUID } = require('../_utils/database');
```

### Step 2: Convert SELECT queries
```javascript
// Old
const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('column', value)
    .single();

// New
const result = await queryOne(
    'SELECT * FROM table_name WHERE column = ?',
    [value]
);
```

### Step 3: Convert INSERT queries
```javascript
// Old
const { data, error } = await supabase
    .from('table_name')
    .insert([{ field1: value1, field2: value2 }])
    .select()
    .single();

// New
const id = generateUUID();
await query(
    'INSERT INTO table_name (id, field1, field2) VALUES (?, ?, ?)',
    [id, value1, value2]
);
const result = await queryOne('SELECT * FROM table_name WHERE id = ?', [id]);
```

### Step 4: Convert UPDATE queries
```javascript
// Old
const { data, error } = await supabase
    .from('table_name')
    .update({ field: value })
    .eq('id', id)
    .select()
    .single();

// New
await query(
    'UPDATE table_name SET field = ? WHERE id = ?',
    [value, id]
);
const result = await queryOne('SELECT * FROM table_name WHERE id = ?', [id]);
```

### Step 5: Convert DELETE queries
```javascript
// Old
const { error } = await supabase
    .from('table_name')
    .delete()
    .eq('id', id);

// New
await query('DELETE FROM table_name WHERE id = ?', [id]);
```

### Step 6: Handle JOINs
```javascript
// Supabase auto-expands relations
const { data } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('id', id);

// MySQL requires explicit JOIN
const product = await queryOne(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
`, [id]);
```

## 🔑 Key Differences

1. **No automatic relation expansion** - Use JOINs
2. **No .or() chaining** - Use SQL OR in WHERE clause
3. **No .ilike()** - Use LIKE with wildcards
4. **Manual UUID generation** - Use `generateUUID()` helper
5. **JSON fields** - Use `JSON.stringify()` before insert, MySQL auto-parses on select

## 📝 Example: Complete API Function Migration

```javascript
// BEFORE (Supabase)
const { supabase } = require('../_utils/supabase');
const { setCorsHeaders, handleOptions } = require('../_utils/cors');

module.exports = async (req, res) => {
    setCorsHeaders(res, req);
    if (handleOptions(req, res)) return;

    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(*)')
            .eq('is_active', true);
        
        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
        
        return res.status(200).json({ success: true, products: data });
    }
};

// AFTER (MySQL)
const { query } = require('../_utils/database');
const { setCorsHeaders, handleOptions } = require('../_utils/cors');

module.exports = async (req, res) => {
    setCorsHeaders(res, req);
    if (handleOptions(req, res)) return;

    if (req.method === 'GET') {
        try {
            const products = await query(`
                SELECT p.*, 
                       c.name as category_name, 
                       c.slug as category_slug,
                       c.icon as category_icon
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.is_active = TRUE
            `);
            
            return res.status(200).json({ 
                success: true, 
                count: products.length,
                products 
            });
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch products' 
            });
        }
    }
};
```

## ⚠️ Important Notes

1. **Error Handling**: MySQL errors are different from Supabase errors
2. **Async/Await**: All database functions are async
3. **Connection Pooling**: Automatic via `database.js` pool
4. **Security**: Always use parameterized queries (?)
5. **Testing**: Test each endpoint after migration

## 🎯 Priority Order

1. **auth/index.js** - Critical for authentication
2. **products.js** - Main product API
3. **orders/index.js** - Order management
4. **categories/index.js** - Category API
5. **admin/index.js** - Admin operations
6. **contact/index.js** - Contact form
7. **activity/index.js** - Activity tracking
8. **mpesa.js** - Payment processing

## ✅ Verification Checklist

After migrating each API function:
- [ ] Test GET endpoints
- [ ] Test POST endpoints
- [ ] Test PUT/UPDATE endpoints
- [ ] Test DELETE endpoints
- [ ] Verify error handling
- [ ] Check authentication works
- [ ] Verify CORS headers
- [ ] Test with frontend

## 🚀 Quick Test Commands

```bash
# Test auth endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# Test products endpoint
curl http://localhost:3000/api/products

# Test with authentication
curl http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
