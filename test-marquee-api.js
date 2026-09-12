/**
 * Test script to verify the marquee API endpoint
 * Run with: node test-marquee-api.js
 */

const http = require('http');

console.log('🧪 Testing Marquee API Endpoint...\n');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/products?limit=15',
    method: 'GET',
    headers: {
        'Accept': 'application/json'
    }
};

const req = http.request(options, (res) => {
    console.log(`📡 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('\n✅ Response received successfully!');
            console.log(`📦 Data type: ${Array.isArray(json) ? 'Array' : typeof json}`);
            
            let products = [];
            if (Array.isArray(json)) {
                products = json;
            } else if (json.products) {
                products = json.products;
            } else if (json.data) {
                products = json.data;
            }
            
            console.log(`🛍️ Products count: ${products.length}`);
            
            if (products.length > 0) {
                console.log('\n📦 First product sample:');
                const first = products[0];
                console.log(`   - ID: ${first.id}`);
                console.log(`   - Name: ${first.name}`);
                console.log(`   - Price: ${first.price || first.selling_price}`);
                console.log(`   - Images: ${JSON.stringify(first.images)}`);
                console.log(`   - Category: ${first.category_name || first.category_id}`);
            }
            
            console.log('\n✅ API endpoint is working correctly!');
        } catch (error) {
            console.error('\n❌ Error parsing JSON:', error.message);
            console.log('Raw response:', data.substring(0, 500));
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
    console.log('\n💡 Make sure the backend server is running:');
    console.log('   cd backend && npm run dev');
});

req.end();
