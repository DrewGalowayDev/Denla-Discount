require('dotenv').config();
const mysql = require('mysql2/promise');

async function createEcommerceTables() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'denla',
        port: parseInt(process.env.DB_PORT) || 3306
    });

    console.log('Creating missing e-commerce tables...\n');

    const tables = [
        {
            name: 'cart',
            sql: `CREATE TABLE IF NOT EXISTS cart (
                id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                user_id CHAR(36) NOT NULL,
                product_id CHAR(36) NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_product_id (product_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        },
        {
            name: 'wishlist',
            sql: `CREATE TABLE IF NOT EXISTS wishlist (
                id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                user_id CHAR(36) NOT NULL,
                product_id CHAR(36) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_wishlist (user_id, product_id),
                INDEX idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        },
        {
            name: 'orders',
            sql: `CREATE TABLE IF NOT EXISTS orders (
                id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                user_id CHAR(36),
                total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
                status ENUM('pending','processing','shipped','delivered','cancelled','refunded') DEFAULT 'pending',
                payment_status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
                payment_method VARCHAR(50),
                shipping_address JSON,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        },
        {
            name: 'order_items',
            sql: `CREATE TABLE IF NOT EXISTS order_items (
                id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                order_id CHAR(36) NOT NULL,
                product_id CHAR(36),
                quantity INT NOT NULL DEFAULT 1,
                price DECIMAL(10,2) NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_order_id (order_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        },
        {
            name: 'reviews',
            sql: `CREATE TABLE IF NOT EXISTS reviews (
                id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                product_id CHAR(36) NOT NULL,
                user_id CHAR(36),
                rating TINYINT NOT NULL DEFAULT 5,
                title VARCHAR(255),
                comment TEXT,
                is_approved BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_product_id (product_id),
                INDEX idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        },
        {
            name: 'contact_messages',
            sql: `CREATE TABLE IF NOT EXISTS contact_messages (
                id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                subject VARCHAR(255),
                message TEXT NOT NULL,
                status ENUM('unread','read','replied') DEFAULT 'unread',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        },
        {
            name: 'mpesa_transactions',
            sql: `CREATE TABLE IF NOT EXISTS mpesa_transactions (
                id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                merchant_request_id VARCHAR(255),
                checkout_request_id VARCHAR(255) UNIQUE NOT NULL,
                phone_number VARCHAR(20) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                account_reference VARCHAR(255),
                transaction_desc VARCHAR(255),
                result_code VARCHAR(10),
                result_desc TEXT,
                mpesa_receipt_number VARCHAR(255),
                transaction_date DATETIME,
                status ENUM('pending','completed','failed','cancelled') DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_checkout_request (checkout_request_id),
                INDEX idx_phone (phone_number),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        }
    ];

    for (const { name, sql } of tables) {
        try {
            await conn.execute(sql);
            console.log('✅', name);
        } catch (e) {
            console.log('⚠️ ', name, '—', e.message);
        }
    }

    console.log('\n✅ All e-commerce tables ready!');
    await conn.end();
}

createEcommerceTables().catch(e => {
    console.error('❌ Fatal:', e.message);
    process.exit(1);
});
