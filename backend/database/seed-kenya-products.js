const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Hackifyoucan254',
    database: process.env.DB_NAME || 'denla'
};

// Categories mapping
const categoryMapping = {
    'Sugar': 'Groceries',
    'Maize Meal': 'Groceries',
    'Flour': 'Groceries',
    'Rice': 'Groceries',
    'Baking': 'Bakery',
    'Milk Powder': 'Dairy Products',
    'Cooking Oil': 'Groceries',
    'Cooking Fat': 'Groceries',
    'Tea': 'Beverages',
    'Coffee': 'Beverages',
    'Chocolate Drink': 'Beverages',
    'Juice': 'Beverages',
    'Soft Drink': 'Beverages',
    'Water': 'Beverages',
    'Fresh Milk': 'Dairy Products',
    'Yoghurt': 'Dairy Products',
    'Noodles': 'Groceries',
    'Snacks': 'Groceries',
    'Detergent': 'Household Items',
    'Bar Soap': 'Household Items',
    'Cleaning': 'Household Items',
    'Bath Soap': 'Personal Care',
    'Toothpaste': 'Personal Care',
    'Lotion': 'Personal Care',
    'Petroleum Jelly': 'Personal Care',
    'Jam': 'Groceries',
    'Toilet Paper': 'Household Items',
    'Tissues': 'Household Items',
    'Spices': 'Groceries',
    'Sauce': 'Groceries',
    'Insecticide': 'Household Items',
    'Shoe Polish': 'Household Items',
    'Matches': 'Household Items',
    'Diapers': 'Personal Care',
    'Antiseptic': 'Personal Care',
    'Salt': 'Groceries'
};

// Products data from CSV
const products = [
    { name: 'Kabras Sugar 2kg', brand: 'West Kenya Sugar', origin: 'Kenya', price: 310, category: 'Sugar' },
    { name: 'Pembe Maize Meal 2kg', brand: 'Pembe Flour Mills', origin: 'Kenya', price: 150, category: 'Maize Meal' },
    { name: 'Soko Maize Meal 2kg', brand: 'Thika Cloth Mills / Soko', origin: 'Kenya', price: 145, category: 'Maize Meal' },
    { name: 'Jogoo Maize Meal 2kg', brand: 'Ungu Limited', origin: 'Kenya', price: 155, category: 'Maize Meal' },
    { name: 'Exe All Purpose Flour 2kg', brand: 'Unga Limited', origin: 'Kenya', price: 180, category: 'Flour' },
    { name: 'Ndovu Wheat Flour 2kg', brand: 'Mombasa Maize Millers', origin: 'Kenya', price: 170, category: 'Flour' },
    { name: 'Daawat Long Grain Rice 2kg', brand: 'Mwea / Pearl Rice', origin: 'Kenya', price: 390, category: 'Rice' },
    { name: 'Pearl Lesorú Rice 5kg', brand: 'Capwell Industries', origin: 'Kenya', price: 850, category: 'Rice' },
    { name: 'Cereal Mwea Pishori Rice 1kg', brand: 'Local Millers', origin: 'Kenya', price: 230, category: 'Rice' },
    { name: 'Chapa Mandashi Baking Powder 50g', brand: 'Kapa Oil Refineries', origin: 'Kenya', price: 35, category: 'Baking' },
    { name: 'Fernleaf Milk Powder 400g', brand: 'Fonterra', origin: 'New Zealand', price: 650, category: 'Milk Powder' },
    { name: 'Fresh Fri Cooking Oil 2L', brand: 'Pwani Oil', origin: 'Kenya', price: 600, category: 'Cooking Oil' },
    { name: 'Fresh Fri Cooking Oil 3L', brand: 'Pwani Oil', origin: 'Kenya', price: 890, category: 'Cooking Oil' },
    { name: 'Fresh Fri Cooking Oil 5L', brand: 'Pwani Oil', origin: 'Kenya', price: 1450, category: 'Cooking Oil' },
    { name: 'Salit Vegetable Oil 1L', brand: 'Pwani Oil', origin: 'Kenya', price: 290, category: 'Cooking Oil' },
    { name: 'Fry Mate Cooking Fat 1kg', brand: 'Kapa Oil Refineries', origin: 'Kenya', price: 330, category: 'Cooking Fat' },
    { name: 'Fry Mate Cooking Fat 500g', brand: 'Kapa Oil Refineries', origin: 'Kenya', price: 175, category: 'Cooking Fat' },
    { name: 'Kimbo Premium Cooking Fat 1kg', brand: 'Bidco Africa', origin: 'Kenya', price: 360, category: 'Cooking Fat' },
    { name: 'Cow Boy Cooking Fat 1kg', brand: 'Bidco Africa', origin: 'Kenya', price: 380, category: 'Cooking Fat' },
    { name: 'Ketepa Pride Tea Bags 50s', brand: 'Ketepa', origin: 'Kenya', price: 1600, category: 'Tea' },
    { name: 'Ketepa Pride Tea Leaves 250g', brand: 'Ketepa', origin: 'Kenya', price: 210, category: 'Tea' },
    { name: 'Safari Pure Tea 250g', brand: 'Ketepa', origin: 'Kenya', price: 230, category: 'Tea' },
    { name: 'Kericho Gold Green Tea 25s', brand: 'Gold Crown Beverages', origin: 'Kenya', price: 240, category: 'Tea' },
    { name: 'Nescafé Classic Coffee 100g', brand: 'Nestlé', origin: 'International', price: 520, category: 'Coffee' },
    { name: 'Cadbury Drinking Chocolate 400g', brand: 'Mondelez', origin: 'International', price: 450, category: 'Chocolate Drink' },
    { name: 'Milo Beverage Powder 400g', brand: 'Nestlé', origin: 'Kenya', price: 480, category: 'Chocolate Drink' },
    { name: 'Del Monte Passion Juice 1L', brand: 'Del Monte Kenya', origin: 'Kenya', price: 210, category: 'Juice' },
    { name: 'Del Monte Pineapple Juice 1L', brand: 'Del Monte Kenya', origin: 'Kenya', price: 210, category: 'Juice' },
    { name: 'Del Monte Mango Juice 1L', brand: 'Del Monte Kenya', origin: 'Kenya', price: 210, category: 'Juice' },
    { name: 'Minute Maid Mango 1L', brand: 'Coca-Cola', origin: 'Kenya', price: 160, category: 'Juice' },
    { name: 'Coca-Cola 500ml', brand: 'Coca-Cola', origin: 'Kenya', price: 60, category: 'Soft Drink' },
    { name: 'Fanta Orange 500ml', brand: 'Coca-Cola', origin: 'Kenya', price: 60, category: 'Soft Drink' },
    { name: 'Sprite 500ml', brand: 'Coca-Cola', origin: 'Kenya', price: 60, category: 'Soft Drink' },
    { name: 'Stoney Tangawizi 500ml', brand: 'Coca-Cola', origin: 'Kenya', price: 65, category: 'Soft Drink' },
    { name: 'Keringet Mineral Water 1L', brand: 'Crown Beverages', origin: 'Kenya', price: 75, category: 'Water' },
    { name: 'Dasani Water 500ml', brand: 'Coca-Cola', origin: 'Kenya', price: 40, category: 'Water' },
    { name: 'Afia Juice Mango 500ml', brand: 'Kevian Kenya', origin: 'Kenya', price: 70, category: 'Juice' },
    { name: 'Brookside Fresh Milk 1L', brand: 'Brookside Dairy', origin: 'Kenya', price: 130, category: 'Fresh Milk' },
    { name: 'KCC Fresh Milk 500ml', brand: 'New KCC', origin: 'Kenya', price: 60, category: 'Fresh Milk' },
    { name: 'KCC Mala 500ml', brand: 'New KCC', origin: 'Kenya', price: 75, category: 'Dairy Products' },
    { name: 'Brookside Lala 500ml', brand: 'Brookside Dairy', origin: 'Kenya', price: 80, category: 'Dairy Products' },
    { name: 'Bio Yoghurt Strawberry 450ml', brand: 'Bio Foods', origin: 'Kenya', price: 160, category: 'Yoghurt' },
    { name: 'Ilara Milk 500ml', brand: 'Brookside Dairy', origin: 'Kenya', price: 60, category: 'Fresh Milk' },
    { name: 'Rina Cooking Fat 1kg', brand: 'Pwani Oil', origin: 'Kenya', price: 320, category: 'Cooking Fat' },
    { name: 'Indomie Instant Noodles Chicken Flavour 70g', brand: 'Indomie Kenya', origin: 'Kenya', price: 40, category: 'Noodles' },
    { name: 'Urban Bites Potato Chips 120g', brand: 'Norda Industries', origin: 'Kenya', price: 160, category: 'Snacks' },
    { name: 'Tropical Sweets Pack', brand: 'Kenafric Industries', origin: 'Kenya', price: 120, category: 'Snacks' },
    { name: 'Cadbury Dairy Milk Chocolate 40g', brand: 'Mondelez', origin: 'International', price: 110, category: 'Snacks' },
    { name: 'Krustles Potato Crisps 50g', brand: 'Krush Foods', origin: 'Kenya', price: 70, category: 'Snacks' },
    { name: 'Nuru Weetabix 450g', brand: 'Weetabix East Africa', origin: 'Kenya', price: 280, category: 'Groceries' },
    { name: 'Omo Hand Wash Powder 1kg', brand: 'Unilever', origin: 'Kenya', price: 390, category: 'Detergent' },
    { name: 'Omo Hand Wash Powder 500g', brand: 'Unilever', origin: 'Kenya', price: 200, category: 'Detergent' },
    { name: 'Ariel Hand Wash Detergent 1kg', brand: 'Procter & Gamble', origin: 'International', price: 410, category: 'Detergent' },
    { name: 'Toss Sensitive Detergent 1kg', brand: 'Bidco Africa', origin: 'Kenya', price: 340, category: 'Detergent' },
    { name: 'Sunshine Bar Soap White 800g', brand: 'Pwani Oil', origin: 'Kenya', price: 160, category: 'Bar Soap' },
    { name: 'Menengai Cream Bar Soap 800g', brand: 'Menengai Soap Factory', origin: 'Kenya', price: 155, category: 'Bar Soap' },
    { name: 'Jamaa Cream Bar Soap 1kg', brand: 'Bidco Africa', origin: 'Kenya', price: 185, category: 'Bar Soap' },
    { name: 'Panga Bar Soap 1kg', brand: 'Kapa Oil Refineries', origin: 'Kenya', price: 180, category: 'Bar Soap' },
    { name: 'Vim Scouring Powder 500g', brand: 'Unilever', origin: 'Kenya', price: 140, category: 'Cleaning' },
    { name: 'Jik Bleach Regular 500ml', brand: 'Reckitt Bencwiser', origin: 'Kenya', price: 160, category: 'Cleaning' },
    { name: 'Harpic Toilet Cleaner 500ml', brand: 'Reckitt Bencwiser', origin: 'Kenya', price: 260, category: 'Cleaning' },
    { name: 'Topex Bleach Regular 500ml', brand: 'Kapa Oil Refineries', origin: 'Kenya', price: 120, category: 'Cleaning' },
    { name: 'Axion Dishwashing Paste 400g', brand: 'Colgate-Palmolive', origin: 'International', price: 220, category: 'Cleaning' },
    { name: 'Dettol Bath Soap Original 175g', brand: 'Reckitt Bencwiser', origin: 'Kenya', price: 160, category: 'Bath Soap' },
    { name: 'Geisha Bath Soap Aloe Vera 225g', brand: 'Unilever', origin: 'Kenya', price: 145, category: 'Bath Soap' },
    { name: 'Imperial Leather Soap Classic 125g', brand: 'PZ Cussons', origin: 'Kenya', price: 110, category: 'Bath Soap' },
    { name: 'Lifebuoy Total 10 Soap 175g', brand: 'Unilever', origin: 'Kenya', price: 130, category: 'Bath Soap' },
    { name: 'Colgate Toothpaste Herbal 120g', brand: 'Colgate-Palmolive', origin: 'International', price: 190, category: 'Toothpaste' },
    { name: 'Colgate Toothpaste Triple Action 120g', brand: 'Colgate-Palmolive', origin: 'International', price: 180, category: 'Toothpaste' },
    { name: 'Aquafresh Toothpaste 100ml', brand: 'Haleon', origin: 'International', price: 175, category: 'Toothpaste' },
    { name: 'Close-Up Toothpaste Red Hot 120g', brand: 'Unilever', origin: 'Kenya', price: 185, category: 'Toothpaste' },
    { name: 'Nivea Cocoa Butter Lotion 400ml', brand: 'Beiersdorf', origin: 'Kenya', price: 550, category: 'Lotion' },
    { name: 'Nivea Men Cool Kick Lotion 400ml', brand: 'Beiersdorf', origin: 'Kenya', price: 580, category: 'Lotion' },
    { name: 'Amara Lotion Cocoa Butter 400ml', brand: 'Haco Industries', origin: 'Kenya', price: 260, category: 'Lotion' },
    { name: 'Valon Petroleum Jelly 250g', brand: 'Haco Industries', origin: 'Kenya', price: 150, category: 'Petroleum Jelly' },
    { name: 'Zesta Plum Jam 500g', brand: 'Trufoods Limited', origin: 'Kenya', price: 240, category: 'Jam' },
    { name: 'Hanifa Toilet Paper 1 Ply 4-Pack', brand: 'Chandaria Industries', origin: 'Kenya', price: 120, category: 'Toilet Paper' },
    { name: 'Velvex Toilet Paper 2 Ply 4-Pack', brand: 'Chandaria Industries', origin: 'Kenya', price: 220, category: 'Toilet Paper' },
    { name: 'Toilex Toilet Paper 1 Ply Single', brand: 'Chandaria Industries', origin: 'Kenya', price: 30, category: 'Toilet Paper' },
    { name: 'Rosy Toilet Paper 2 Ply 4-Pack', brand: 'Kim-Fay East Africa', origin: 'Kenya', price: 200, category: 'Toilet Paper' },
    { name: 'Fay Tissues Pocket Pack', brand: 'Kim-Fay East Africa', origin: 'Kenya', price: 40, category: 'Tissues' },
    { name: 'Royco Mchuzi Mix Beef 200g', brand: 'Unilever', origin: 'Kenya', price: 190, category: 'Spices' },
    { name: 'Royco Mchuzi Mix Chicken 200g', brand: 'Unilever', origin: 'Kenya', price: 190, category: 'Spices' },
    { name: 'Tropical Heat Beef Masala 100g', brand: 'Deepa Industries', origin: 'Kenya', price: 140, category: 'Spices' },
    { name: 'Tropical Heat Pilau Masala 100g', brand: 'Deepa Industries', origin: 'Kenya', price: 150, category: 'Spices' },
    { name: 'Peptang Tomato Sauce 400g', brand: 'Trufoods Limited', origin: 'Kenya', price: 160, category: 'Sauce' },
    { name: 'Peptang Tomato Paste 70g', brand: 'Trufoods Limited', origin: 'Kenya', price: 45, category: 'Sauce' },
    { name: 'Zesta Tomato Sauce 400g', brand: 'Trufoods Limited', origin: 'Kenya', price: 140, category: 'Sauce' },
    { name: 'Nzoia Sugar 1kg', brand: 'Nzoia Sugar Company', origin: 'Kenya', price: 150, category: 'Sugar' },
    { name: 'Doom Mosquito Killer Spray 400ml', brand: 'Tiger Brands', origin: 'International', price: 420, category: 'Insecticide' },
    { name: 'Mortein Doom Insecticide 400ml', brand: 'Reckitt Bencwiser', origin: 'Kenya', price: 450, category: 'Insecticide' },
    { name: 'Raid Mosquito Spray 400ml', brand: 'SC Johnson', origin: 'International', price: 430, category: 'Insecticide' },
    { name: 'Kiwi Shoe Polish Black 40ml', brand: 'SC Johnson', origin: 'Kenya', price: 90, category: 'Shoe Polish' },
    { name: 'Kiwi Shoe Polish Dark Tan 40ml', brand: 'SC Johnson', origin: 'Kenya', price: 90, category: 'Shoe Polish' },
    { name: 'Matchboxes Ship Brand 10-Pack', brand: 'Match Masters', origin: 'Kenya', price: 50, category: 'Matches' },
    { name: 'Whale Bar Soap 800g', brand: 'Bidco Africa', origin: 'Kenya', price: 150, category: 'Bar Soap' },
    { name: 'Pampers Baby Dry Size 3 64pcs', brand: 'Procter & Gamble', origin: 'International', price: 1250, category: 'Diapers' },
    { name: 'Pampers Baby Dry Size 4 54pcs', brand: 'Procter & Gamble', origin: 'International', price: 1250, category: 'Diapers' },
    { name: 'Huggies Dry Comfort Size 3 58pcs', brand: 'Kim-Fay / Kimberly-Clark', origin: 'International', price: 1150, category: 'Diapers' },
    { name: 'Softcare Baby Diapers Large 48pcs', brand: 'Chinese Softcare', origin: 'Kenya', price: 850, category: 'Diapers' },
    { name: 'Dettol Liquid Antiseptic 250ml', brand: 'Reckitt Bencwiser', origin: 'Kenya', price: 380, category: 'Antiseptic' },
    { name: 'Betadine Antiseptic Solution 50ml', brand: 'MundiPharma', origin: 'International', price: 320, category: 'Antiseptic' },
    { name: 'Dolio Sunflower Oil 1L', brand: 'Bidco Africa', origin: 'Kenya', price: 350, category: 'Cooking Oil' },
    { name: 'Golden Fry Cooking Oil 1L', brand: 'Bidco Africa', origin: 'Kenya', price: 300, category: 'Cooking Oil' },
    { name: 'Elianto Corn Oil 1L', brand: 'Bidco Africa', origin: 'Kenya', price: 420, category: 'Cooking Oil' },
    { name: 'Unyango Table Salt 500g', brand: 'Kensalt', origin: 'Kenya', price: 25, category: 'Salt' },
    { name: 'Chapatux Baking Powder 100g', brand: 'Local Packers', origin: 'Kenya', price: 55, category: 'Baking' },
    { name: 'Ndovu Maize Meal 2kg', brand: 'Mombasa Maize Millers', origin: 'Kenya', price: 150, category: 'Maize Meal' }
];

async function seedKenyaProducts() {
    let connection;
    
    try {
        console.log('🔌 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // Get or create categories
        console.log('\n📁 Setting up categories...');
        const categoryIds = {};
        const uniqueCategories = [...new Set(Object.values(categoryMapping))];

        for (const categoryName of uniqueCategories) {
            const [existingCat] = await connection.query(
                'SELECT id FROM categories WHERE name = ?',
                [categoryName]
            );

            if (existingCat.length > 0) {
                categoryIds[categoryName] = existingCat[0].id;
                console.log(`   ✓ Category exists: ${categoryName}`);
            } else {
                const categoryId = uuidv4();
                await connection.query(
                    'INSERT INTO categories (id, name, description, is_active) VALUES (?, ?, ?, ?)',
                    [categoryId, categoryName, `${categoryName} products`, true]
                );
                categoryIds[categoryName] = categoryId;
                console.log(`   ✓ Created category: ${categoryName}`);
            }
        }

        // Get default supplier
        console.log('\n📦 Setting up supplier...');
        const [suppliers] = await connection.query('SELECT id FROM suppliers LIMIT 1');
        let supplierId;

        if (suppliers.length > 0) {
            supplierId = suppliers[0].id;
            console.log('   ✓ Using existing supplier');
        } else {
            supplierId = uuidv4();
            await connection.query(
                `INSERT INTO suppliers (id, name, contact_person, email, phone, address, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [supplierId, 'Kenya Local Suppliers', 'Supply Manager', 'supplies@denla.com', '+254700000000', 'Nairobi, Kenya', true]
            );
            console.log('   ✓ Created default supplier');
        }

        // Insert products
        console.log('\n🛒 Seeding products...');
        let insertedCount = 0;
        let skippedCount = 0;

        for (const product of products) {
            const categoryName = categoryMapping[product.category] || 'Groceries';
            const categoryId = categoryIds[categoryName];
            
            // Generate SKU from product name
            const sku = product.name
                .replace(/[^a-zA-Z0-9]/g, '-')
                .replace(/-+/g, '-')
                .substring(0, 20)
                .toUpperCase();

            // Check if product already exists
            const [existing] = await connection.query(
                'SELECT id FROM products WHERE name = ? OR sku = ?',
                [product.name, sku]
            );

            if (existing.length > 0) {
                skippedCount++;
                continue;
            }

            const productId = uuidv4();
            const costPrice = product.price * 0.75; // Assume 25% markup
            const sellingPrice = product.price;

            await connection.query(
                `INSERT INTO products (
                    id, category_id, default_supplier_id, name, description, sku, 
                    barcode, cost_price, selling_price, unit_of_measure,
                    minimum_stock, current_stock, is_active, tax_rate, brand
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    productId,
                    categoryId,
                    supplierId,
                    product.name,
                    `${product.brand} - ${product.origin}`,
                    sku,
                    null, // Barcode can be added later
                    costPrice,
                    sellingPrice,
                    'piece',
                    5,
                    Math.floor(Math.random() * 50) + 20, // Random stock between 20-70
                    true,
                    16.00, // 16% VAT
                    product.brand
                ]
            );

            insertedCount++;
        }

        console.log(`\n✅ Seeding completed!`);
        console.log(`   📊 Products inserted: ${insertedCount}`);
        console.log(`   ⏭️  Products skipped (already exist): ${skippedCount}`);
        console.log(`   📁 Categories: ${Object.keys(categoryIds).length}`);
        console.log(`\n🎉 Database seeded successfully with Kenyan products!`);

    } catch (error) {
        console.error('\n❌ Error seeding database:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the seed function
seedKenyaProducts()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
