const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database connection
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Hackifyoucan254',
    database: 'denla'
};

// Image directory
const imageDir = path.join(__dirname, '../../public/img/items');

// Smart matching function - matches product names to image filenames
function matchProductToImage(productName, productBrand, imageFiles) {
    const cleanName = productName.toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
    
    const cleanBrand = (productBrand || '').toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();

    // Try exact match first
    for (const imgFile of imageFiles) {
        const imgName = imgFile.toLowerCase().replace(/\.(jpg|jpeg|png|webp)$/i, '');
        const cleanImgName = imgName.replace(/\s+/g, ' ').replace(/[^a-z0-9\s]/g, '').trim();
        
        if (cleanName.includes(cleanImgName) || cleanImgName.includes(cleanName)) {
            return imgFile;
        }
    }

    // Extract key terms from product name (brand, product type, main keyword)
    const terms = [];
    
    // Add brand if exists
    if (cleanBrand) {
        terms.push(cleanBrand);
    }
    
    // Extract main product keywords
    const keywords = cleanName.split(' ');
    for (const keyword of keywords) {
        if (keyword.length >= 3 && !['the', 'and', 'for', 'with'].includes(keyword)) {
            terms.push(keyword);
        }
    }

    // Try matching with key terms
    for (const term of terms) {
        for (const imgFile of imageFiles) {
            const imgName = imgFile.toLowerCase().replace(/\.(jpg|jpeg|png|webp)$/i, '');
            if (imgName.includes(term) || term.includes(imgName)) {
                return imgFile;
            }
        }
    }

    // Specific brand/product mappings
    const mappings = {
        'afia': ['afia drink'],
        'always': ['always pads'],
        'amara': ['amara lotion'],
        'aquafresh': ['aquafresh toothpaste'],
        'ariel': ['ariel handwash'],
        'bio yoghurt': ['bio yoghurt'],
        'brookside': ['brookside fresh milk'],
        'cadbury': ['cadbury drinking chocolate'],
        'chapa': ['chapa mandashi'],
        'closeup': ['closeup toothpaste'],
        'coca cola': ['cocacola drink'],
        'colgate': ['colgate'],
        'cow boy': ['cow boy cooking fat'],
        'daawat': ['daawatrice'],
        'dasani': ['dasani water'],
        'del monte': ['delmonte juice'],
        'dettol': ['dettol soap'],
        'elianto': ['eliantocorn'],
        'exe': ['exeflour'],
        'fresh fri': ['fresdh fri'],
        'fry mate': ['fry mate cooking fat'],
        'geisha': ['geisha sopa'],
        'golden fry': ['goldenfry'],
        'ilara': ['ilara yoghurt'],
        'imperial leather': ['imperial leather'],
        'indomie': ['indomie noodles'],
        'jamaa': ['jamaa soap'],
        'jik': ['jik bleaching'],
        'jogoo': ['jogoomaizeflour'],
        'kabras': ['kabrassugar'],
        'kcc': ['kcc fresh milk', 'mala kcc milk'],
        'kericho': ['kericho golden tea'],
        'keringet': ['keringet drinking wtaer'],
        'ketepa': ['ketepa'],
        'kimbo': ['kimbo cooking fat'],
        'kiwi': ['kiwi shoe polish'],
        'krustles': ['krustles potato crisps'],
        'lifebuoy': ['lifebuoy soap'],
        'mala': ['mala kcc milk'],
        'menengai': ['menengai soap'],
        'milo': ['milo beversage powder'],
        'minute maid': ['minute maid'],
        'mortein': ['mortein doom'],
        'doom': ['mortein doom'],
        'ndovu': ['ndovu wheat flour', 'ndovuflour'],
        'nescafe': ['nescafe coffee'],
        'nivea men': ['nivea men'],
        'nivea cocoa': ['niveacocoa buuter'],
        'nuru': ['nruru weetabix'],
        'weetabix': ['nruru weetabix'],
        'nzoia': ['nzoia sugar'],
        'omo': ['omo handwash powder'],
        'pampers': ['pampers baby dry'],
        'pearl': ['pearlrice'],
        'pembe': ['pembemaizeflour'],
        'peptang': ['peptang tomato sauce'],
        'pishori': ['pishorimwearice'],
        'rina': ['rina cooking fat'],
        'rosy': ['rossy tissue paper'],
        'royco': ['royco mchuzi mix'],
        'safari': ['safari pure tea'],
        'salit': ['salit oil'],
        'sawa': ['sawa soap'],
        'soko': ['sokomaizeflour'],
        'stoney': ['stoney tangawizi'],
        'sunlight': ['sunlight soap'],
        'toss': ['toss detergents'],
        'tropical heat': ['tropical heat'],
        'tropical': ['tropical mints'],
        'valon': ['valon lotion'],
        'velvex': ['velvex']
    };

    // Check mappings
    for (const [key, images] of Object.entries(mappings)) {
        if (cleanName.includes(key) || cleanBrand.includes(key)) {
            for (const img of images) {
                const matchedFile = imageFiles.find(f => 
                    f.toLowerCase().replace(/\.(jpg|jpeg|png|webp)$/i, '').includes(img.toLowerCase().replace(/\s+/g, ''))
                );
                if (matchedFile) {
                    return matchedFile;
                }
            }
        }
    }

    return null;
}

async function mapProductImages() {
    let connection;
    
    try {
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // Get all image files
        const imageFiles = fs.readdirSync(imageDir).filter(f => 
            /\.(jpg|jpeg|png|webp)$/i.test(f)
        );
        console.log(`📁 Found ${imageFiles.length} images in ${imageDir}`);

        // Get all products
        const [products] = await connection.execute(
            'SELECT id, name, brand, images FROM products ORDER BY name'
        );
        console.log(`📦 Found ${products.length} products in database\n`);

        let matched = 0;
        let unmatched = 0;
        const updates = [];

        // Match each product to an image
        for (const product of products) {
            const imagePath = matchProductToImage(product.name, product.brand, imageFiles);
            
            if (imagePath) {
                const imageUrl = `/img/items/${imagePath}`;
                updates.push({
                    id: product.id,
                    name: product.name,
                    imagePath: imageUrl
                });
                matched++;
                console.log(`✅ ${product.name} → ${imagePath}`);
            } else {
                unmatched++;
                console.log(`❌ ${product.name} → No match found`);
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`   Matched: ${matched}`);
        console.log(`   Unmatched: ${unmatched}`);
        console.log(`\n🔄 Updating database...`);

        // Update database - store as JSON array
        for (const update of updates) {
            const imagesJson = JSON.stringify([update.imagePath]);
            await connection.execute(
                'UPDATE products SET images = ? WHERE id = ?',
                [imagesJson, update.id]
            );
        }

        console.log(`✅ Database updated successfully!`);
        console.log(`\n✨ ${matched} products now have images!`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✅ Database connection closed');
        }
    }
}

// Run the script
mapProductImages().catch(console.error);
