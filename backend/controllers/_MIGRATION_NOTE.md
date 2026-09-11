# Controllers Migration Status

## ✅ Completed Controllers (MySQL Ready)
- `authController.js` - Full authentication system
- `productController.js` - Complete product management
- `categoryController.js` - Category CRUD operations
- `cartController.js` - Shopping cart management
- `userController.js` - User management

## ⏳ Remaining Controllers (Need Manual Update)
These controllers follow the same pattern. Update them using the completed ones as reference:

### orderController.js
- Replace `supabase.from('orders')` with MySQL queries
- Use `transaction()` helper for order creation (insert order + order_items)
- Join with users and products tables for complete data

### reviewController.js
- Replace Supabase queries with MySQL
- Use triggers already in place for rating updates

### wishlistController.js
- Simple CRUD operations similar to cartController

### paymentController.js
- Update Stripe integration queries
- M-Pesa transactions already have a table (mpesa_transactions)

## Migration Pattern Example

**Before (Supabase):**
```javascript
const { data, error } = await supabase
    .from('orders')
    .select('*, users(*), order_items(*)')
    .eq('id', orderId)
    .single();
```

**After (MySQL):**
```javascript
const order = await queryOne(`
    SELECT o.*, u.name as user_name, u.email as user_email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
`, [orderId]);

const orderItems = await query(`
    SELECT oi.*, p.name as product_name
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
`, [orderId]);

order.order_items = orderItems;
order.user = { name: order.user_name, email: order.user_email };
```

## Key Differences to Remember

1. **No RLS in MySQL** - Handle permissions in middleware
2. **Manual JOINs** - MySQL doesn't auto-expand relations like Supabase
3. **JSON Fields** - Use `JSON.stringify()` and `JSON.parse()` for JSON columns
4. **UUIDs** - Use `generateUUID()` helper or let MySQL generate with UUID()
5. **Timestamps** - MySQL auto-handles `created_at` and `updated_at`
6. **Backticks** - Escape reserved words like `condition` with backticks

## Helper Functions Available

From `config/database.js`:
- `query(sql, params)` - Execute query
- `queryOne(sql, params)` - Get single row
- `transaction(callback)` - Run transaction
- `generateUUID()` - Generate UUID

From `utils/dbHelpers.js`:
- `findById(table, id)`
- `findByField(table, field, value)`
- `updateById(table, id, data)`
- `deleteById(table, id)`
- `getPaginated(table, options)`
- `exists(table, field, value)`
