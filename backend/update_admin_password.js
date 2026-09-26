const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function updateAdminPassword() {
    try {
        // Generate hash for 'admin123'
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        console.log('Generated password hash for "admin123":');
        console.log(hashedPassword);
        console.log('\n--- Copy and run this SQL on your server ---\n');
        
        // Print SQL to update admin user
        console.log(`UPDATE users SET password = '${hashedPassword}' WHERE email = 'admin@denla.com';`);
        console.log('\n--- Or run this Docker command on your server ---\n');
        console.log(`docker exec -it mxcz5sejqtboqpb2wtkjgchn mysql -u denla -pHackifyoucan254 -e "USE denla; UPDATE users SET password = '${hashedPassword}' WHERE email = 'admin@denla.com';"`);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

updateAdminPassword();
