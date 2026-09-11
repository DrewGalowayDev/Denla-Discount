require('dotenv').config();
const mysql = require('mysql2/promise');

async function fix() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'denla',
        port: parseInt(process.env.DB_PORT) || 3306
    });

    const [pcols] = await conn.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'"
    );
    const existing = pcols.map(c => c.COLUMN_NAME);

    // Add e-commerce columns missing from POS schema
    const toAdd = [
        { col: 'price',       def: 'DECIMAL(10,2) DEFAULT 0' },
        { col: 'old_price',   def: 'DECIMAL(10,2) DEFAULT NULL' },
        { col: 'stock',       def: 'INT DEFAULT 0' },
        { col: 'images',      def: 'JSON' },
        { col: 'condition',   def: "VARCHAR(50) DEFAULT 'new'" }
    ];

    for (const { col, def } of toAdd) {
        if (!existing.includes(col)) {
            await conn.execute(`ALTER TABLE products ADD COLUMN \`${col}\` ${def}`);
            console.log('✅ Added column:', col);
        } else {
            console.log('⏭  Already exists:', col);
        }
    }

    // Sync price from selling_price and stock from current_stock where price=0
    await conn.execute('UPDATE products SET price = selling_price WHERE price = 0 AND selling_price > 0');
    await conn.execute('UPDATE products SET stock = current_stock WHERE stock = 0 AND current_stock > 0');
    await conn.execute("UPDATE products SET images = JSON_ARRAY(COALESCE(image, 'img/product-1.png')) WHERE images IS NULL AND image IS NOT NULL");
    console.log('✅ Synced price, stock, images from POS columns');

    // Also check users table for e-commerce columns
    const [ucols] = await conn.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'"
    );
    const uexisting = ucols.map(c => c.COLUMN_NAME);
    console.log('\nExisting users columns:', uexisting.join(', '));

    const userNeeded = [
        { col: 'avatar_url',          def: 'TEXT' },
        { col: 'google_id',           def: 'VARCHAR(255)' },
        { col: 'email_verified',      def: 'BOOLEAN DEFAULT FALSE' },
        { col: 'reset_token',         def: 'VARCHAR(255)' },
        { col: 'reset_token_expiry',  def: 'DATETIME' },
        { col: 'role',                def: "VARCHAR(50) DEFAULT 'user'" },
        { col: 'is_active',           def: 'BOOLEAN DEFAULT TRUE' }
    ];
    for (const { col, def } of userNeeded) {
        if (!uexisting.includes(col)) {
            await conn.execute(`ALTER TABLE users ADD COLUMN \`${col}\` ${def}`);
            console.log('✅ Added users column:', col);
        } else {
            console.log('⏭  Already exists in users:', col);
        }
    }

    console.log('\n✅ Schema patch complete.');
    await conn.end();
}

fix().catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
});
