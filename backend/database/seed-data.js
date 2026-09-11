#!/usr/bin/env node

/**
 * Database Seeding Script
 * Seeds the database with sample data for testing
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function seedDatabase() {
    log('\n========================================', 'cyan');
    log('  Database Seeding - Sample Data', 'bright');
    log('========================================\n', 'cyan');

    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'denla',
        port: parseInt(process.env.DB_PORT) || 3306
    };

    let connection;

    try {
        log('🔌 Connecting to database...', 'yellow');
        connection = await mysql.createConnection(config);
        log('✅ Connected successfully\n', 'green');

        // Sample Suppliers
        log('📦 Seeding Suppliers...', 'yellow');
        const suppliers = [
            {
                id: generateUUID(),
                name: 'Fresh Foods Ltd',
                contact_person: 'John Mwangi',
                email: 'info@freshfoods.co.ke',
                phone: '+254712345678',
                address: 'Nairobi, Kenya',
                payment_terms: 'Net 30',
                credit_limit: 500000
            },
            {
                id: generateUUID(),
                name: 'Dairy Producers Kenya',
                contact_person: 'Mary Wanjiru',
                email: 'sales@dairykenya.com',
                phone: '+254723456789',
                address: 'Kiambu, Kenya',
                payment_terms: 'Cash on Delivery',
                credit_limit: 0
            },
            {
                id: generateUUID(),
                name: 'Beverage Distributors',
                contact_person: 'Peter Kamau',
                email: 'orders@beveragedist.co.ke',
                phone: '+254734567890',
                address: 'Mombasa, Kenya',
                payment_terms: 'Net 15',
                credit_limit: 300000
            }
        ];

        for (const supplier of suppliers) {
            await connection.query(
                `INSERT INTO suppliers (id, name, contact_person, email, phone, address, payment_terms, credit_limit) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [supplier.id, supplier.name, supplier.contact_person, supplier.email, 
                 supplier.phone, supplier.address, supplier.payment_terms, supplier.credit_limit]
            );
        }
        log(`✅ Added ${suppliers.length} suppliers\n`, 'green');

        // Get category IDs
        const [categories] = await connection.query('SELECT id, name FROM categories');
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.name] = cat.id;
        });

        // Sample Products
        log('🛍️  Seeding Products...', 'yellow');
        const products = [
            // Groceries
            { name: 'Rice - 1kg', sku: 'GRC001', barcode: '1234567890001', category: 'Groceries', cost: 80, price: 120, stock: 500, unit: 'kg', supplier: suppliers[0].id },
            { name: 'Sugar - 2kg', sku: 'GRC002', barcode: '1234567890002', category: 'Groceries', cost: 150, price: 200, stock: 300, unit: 'kg', supplier: suppliers[0].id },
            { name: 'Cooking Oil - 1L', sku: 'GRC003', barcode: '1234567890003', category: 'Groceries', cost: 200, price: 280, stock: 200, unit: 'liter', supplier: suppliers[0].id },
            { name: 'Flour - 2kg', sku: 'GRC004', barcode: '1234567890004', category: 'Groceries', cost: 100, price: 150, stock: 400, unit: 'kg', supplier: suppliers[0].id },
            
            // Beverages
            { name: 'Coca Cola - 500ml', sku: 'BEV001', barcode: '1234567890011', category: 'Beverages', cost: 30, price: 50, stock: 600, unit: 'piece', supplier: suppliers[2].id },
            { name: 'Mineral Water - 500ml', sku: 'BEV002', barcode: '1234567890012', category: 'Beverages', cost: 20, price: 35, stock: 800, unit: 'piece', supplier: suppliers[2].id },
            { name: 'Orange Juice - 1L', sku: 'BEV003', barcode: '1234567890013', category: 'Beverages', cost: 80, price: 120, stock: 150, unit: 'liter', supplier: suppliers[2].id },
            
            // Dairy Products
            { name: 'Fresh Milk - 1L', sku: 'DAI001', barcode: '1234567890021', category: 'Dairy Products', cost: 60, price: 90, stock: 200, unit: 'liter', supplier: suppliers[1].id, has_expiry: true },
            { name: 'Yogurt - 500ml', sku: 'DAI002', barcode: '1234567890022', category: 'Dairy Products', cost: 50, price: 80, stock: 150, unit: 'piece', supplier: suppliers[1].id, has_expiry: true },
            { name: 'Butter - 500g', sku: 'DAI003', barcode: '1234567890023', category: 'Dairy Products', cost: 180, price: 250, stock: 100, unit: 'g', supplier: suppliers[1].id, has_expiry: true },
            
            // Bakery
            { name: 'White Bread', sku: 'BAK001', barcode: '1234567890031', category: 'Bakery', cost: 30, price: 55, stock: 200, unit: 'piece', supplier: suppliers[0].id, has_expiry: true },
            { name: 'Brown Bread', sku: 'BAK002', barcode: '1234567890032', category: 'Bakery', cost: 35, price: 60, stock: 150, unit: 'piece', supplier: suppliers[0].id, has_expiry: true },
            
            // Household Items
            { name: 'Soap Bar', sku: 'HOU001', barcode: '1234567890041', category: 'Household Items', cost: 40, price: 65, stock: 300, unit: 'piece', supplier: suppliers[0].id },
            { name: 'Detergent - 1kg', sku: 'HOU002', barcode: '1234567890042', category: 'Household Items', cost: 150, price: 220, stock: 180, unit: 'kg', supplier: suppliers[0].id },
            { name: 'Toilet Paper - 4 Roll', sku: 'HOU003', barcode: '1234567890043', category: 'Household Items', cost: 120, price: 180, stock: 200, unit: 'pack', supplier: suppliers[0].id },
            
            // Personal Care
            { name: 'Toothpaste', sku: 'PER001', barcode: '1234567890051', category: 'Personal Care', cost: 80, price: 120, stock: 250, unit: 'piece', supplier: suppliers[0].id },
            { name: 'Shampoo - 400ml', sku: 'PER002', barcode: '1234567890052', category: 'Personal Care', cost: 180, price: 280, stock: 150, unit: 'ml', supplier: suppliers[0].id },
            { name: 'Body Lotion - 500ml', sku: 'PER003', barcode: '1234567890053', category: 'Personal Care', cost: 200, price: 320, stock: 120, unit: 'ml', supplier: suppliers[0].id }
        ];

        for (const product of products) {
            const productId = generateUUID();
            const categoryId = categoryMap[product.category];
            
            await connection.query(
                `INSERT INTO products (id, name, sku, barcode, category_id, unit_of_measure, 
                 cost_price, selling_price, wholesale_price, minimum_price, current_stock, 
                 minimum_stock, has_expiry, default_supplier_id, is_taxable, tax_rate) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 10, ?, ?, 1, 16.00)`,
                [productId, product.name, product.sku, product.barcode, categoryId, product.unit,
                 product.cost, product.price, product.price * 0.9, product.price * 0.85, 
                 product.stock, product.has_expiry ? 1 : 0, product.supplier]
            );
        }
        log(`✅ Added ${products.length} products\n`, 'green');

        // Sample Customers
        log('👥 Seeding Customers...', 'yellow');
        const customers = [
            { name: 'Walk-in Customer', phone: null, email: null, type: 'regular' },
            { name: 'Jane Doe', phone: '+254700111222', email: 'jane@example.com', type: 'regular' },
            { name: 'ABC Restaurant', phone: '+254700333444', email: 'orders@abcrestaurant.com', type: 'wholesale', credit: 100000 },
            { name: 'XYZ Hotel', phone: '+254700555666', email: 'procurement@xyzhotel.com', type: 'wholesale', credit: 200000 }
        ];

        for (const customer of customers) {
            await connection.query(
                `INSERT INTO customers (id, name, phone, email, customer_type, credit_limit) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [generateUUID(), customer.name, customer.phone, customer.email, 
                 customer.type, customer.credit || 0]
            );
        }
        log(`✅ Added ${customers.length} customers\n`, 'green');

        log('========================================', 'cyan');
        log('  ✅ Database Seeding Complete!', 'green');
        log('========================================\n', 'cyan');

        log('📊 Summary:', 'cyan');
        log(`   - Suppliers: ${suppliers.length}`, 'green');
        log(`   - Products: ${products.length}`, 'green');
        log(`   - Customers: ${customers.length}`, 'green');
        log(`   - Categories: ${categories.length} (pre-seeded)\n`, 'green');

        log('📌 Next Step:', 'cyan');
        log('   Run: node backend/database/create-admin.js\n');

    } catch (error) {
        log('\n❌ Error seeding database:', 'red');
        log(`   ${error.message}\n`, 'red');
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run seeding
seedDatabase();
