#!/usr/bin/env node

/**
 * Create Admin User Script
 * Creates an admin user for the POS system
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
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

async function createAdminUser() {
    log('\n========================================', 'cyan');
    log('  Create Admin User', 'bright');
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

        // Check if admin already exists
        log('🔍 Checking for existing admin users...', 'yellow');
        const [existingAdmins] = await connection.query(
            'SELECT email FROM users WHERE role = ? LIMIT 1',
            ['admin']
        );

        if (existingAdmins.length > 0) {
            log('⚠️  Admin user already exists!', 'yellow');
            log(`   Email: ${existingAdmins[0].email}\n`, 'yellow');
            log('💡 To create a new admin, delete the existing one first or modify this script.\n');
            return;
        }

        // Admin user details
        const adminUser = {
            id: generateUUID(),
            name: 'System Administrator',
            email: 'admin@denla.com',
            password: 'admin123', // Default password - MUST BE CHANGED
            employee_id: 'EMP001',
            phone: '+254700000000',
            role: 'admin'
        };

        log('👤 Creating admin user...', 'yellow');
        log(`   Name: ${adminUser.name}`, 'cyan');
        log(`   Email: ${adminUser.email}`, 'cyan');
        log(`   Employee ID: ${adminUser.employee_id}`, 'cyan');
        log(`   Role: ${adminUser.role}\n`, 'cyan');

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminUser.password, salt);

        // Insert admin user
        await connection.query(
            `INSERT INTO users (id, name, email, password, phone, employee_id, role, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [adminUser.id, adminUser.name, adminUser.email, hashedPassword, 
             adminUser.phone, adminUser.employee_id, adminUser.role]
        );

        log('✅ Admin user created successfully!\n', 'green');

        log('========================================', 'cyan');
        log('  🎉 Setup Complete!', 'green');
        log('========================================\n', 'cyan');

        log('📝 Login Credentials:', 'bright');
        log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
        log(`   Email:    ${adminUser.email}`, 'green');
        log(`   Password: ${adminUser.password}`, 'green');
        log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

        log('⚠️  IMPORTANT SECURITY NOTICE:', 'red');
        log('   1. Change the default password immediately after first login', 'yellow');
        log('   2. Keep your credentials secure', 'yellow');
        log('   3. Never share your admin password\n', 'yellow');

        log('🚀 Next Steps:', 'cyan');
        log('   1. Start the server: npm run dev', 'green');
        log('   2. Login with the credentials above', 'green');
        log('   3. Change your password from the profile settings', 'green');
        log('   4. Create additional users (cashiers, managers, etc.)\n', 'green');

        // Create additional sample users
        log('👥 Creating sample staff users...', 'yellow');
        
        const sampleUsers = [
            {
                id: generateUUID(),
                name: 'John Kamau',
                email: 'cashier1@denla.com',
                password: 'cashier123',
                employee_id: 'EMP002',
                phone: '+254711111111',
                role: 'cashier'
            },
            {
                id: generateUUID(),
                name: 'Mary Wanjiku',
                email: 'manager@denla.com',
                password: 'manager123',
                employee_id: 'EMP003',
                phone: '+254722222222',
                role: 'manager'
            },
            {
                id: generateUUID(),
                name: 'Peter Omondi',
                email: 'inventory@denla.com',
                password: 'inventory123',
                employee_id: 'EMP004',
                phone: '+254733333333',
                role: 'inventory_clerk'
            }
        ];

        for (const user of sampleUsers) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(user.password, salt);
            
            await connection.query(
                `INSERT INTO users (id, name, email, password, phone, employee_id, role, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                [user.id, user.name, user.email, hashedPassword, 
                 user.phone, user.employee_id, user.role]
            );
        }

        log(`✅ Created ${sampleUsers.length} sample staff users\n`, 'green');

        log('📋 Sample Staff Credentials:', 'cyan');
        log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
        sampleUsers.forEach(user => {
            log(`   ${user.role.toUpperCase().padEnd(20)} | ${user.email.padEnd(25)} | ${user.password}`, 'yellow');
        });
        log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

    } catch (error) {
        log('\n❌ Error creating admin user:', 'red');
        log(`   ${error.message}\n`, 'red');
        
        if (error.code === 'ER_DUP_ENTRY') {
            log('💡 Tip: An admin user might already exist with this email.\n', 'yellow');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the script
createAdminUser();
