require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, queryOne } = require('./config/database');

async function diagnoseAdmin() {
    console.log('==================================================');
    console.log('ADMIN LOGIN DIAGNOSTICS');
    console.log('==================================================\n');

    const expectedEmail = 'admin@awesometech.co.ke';
    const expectedPassword = 'awesometech254';

    try {
        console.log(`1️⃣  Checking if user exists: ${expectedEmail}`);
        const user = await queryOne(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [expectedEmail]
        );

        if (!user) {
            console.log('❌ User NOT found in database!');
            console.log('\n📝 Create the admin user by running: node create_admin.js');
            return;
        }

        console.log('✅ User found!');
        console.log('   ID:', user.id);
        console.log('   Name:', user.name);
        console.log('   Email:', user.email);
        console.log('   Role:', user.role);

        console.log(`\n2️⃣  Testing password: ${expectedPassword}`);
        const isMatch = await bcrypt.compare(expectedPassword, user.password);

        if (isMatch) {
            console.log('✅ Password matches!');
            console.log('\n🎉 DIAGNOSIS: Admin credentials are CORRECT!');
        } else {
            console.log('❌ Password does NOT match!');
            const salt = await bcrypt.genSalt(10);
            const correctHash = await bcrypt.hash(expectedPassword, salt);
            console.log('\nCorrect hash for password "' + expectedPassword + '":');
            console.log(correctHash);
            console.log('\n📋 Run this SQL in MySQL:');
            console.log(`UPDATE users SET password = '${correctHash}' WHERE email = '${expectedEmail}';\n`);
        }

        console.log(`\n3️⃣  Checking login with name field...`);
        const userByName = await queryOne(
            'SELECT id, name FROM users WHERE name = ? LIMIT 1',
            [user.name]
        );
        if (userByName) {
            console.log(`✅ User can also login with name: "${user.name}"`);
        }

    } catch (error) {
        console.error('\n❌ Error during diagnosis:', error.message || error);
        console.error('\nPossible causes:');
        console.error('1. MySQL not running — check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in backend/.env');
        console.error('2. Database "denla" does not exist');
    }

    console.log('\n==================================================');
    console.log('DIAGNOSIS COMPLETE');
    console.log('==================================================');
}

diagnoseAdmin();
