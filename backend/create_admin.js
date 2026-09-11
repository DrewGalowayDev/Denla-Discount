/**
 * create_admin.js
 *
 * Usage — from the `backend` folder:
 *   node create_admin.js
 *
 * This script will upsert a new admin user with:
 *  - email: admin@gmail.com
 *  - username/name: admin
 *  - password: admin123
 *  - role: admin
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, queryOne, generateUUID } = require('./config/database');

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_NAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

(async () => {
    try {
        console.log('Hashing password...');
        const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);

        console.log(`Checking for existing user with email: ${ADMIN_EMAIL}`);
        const existing = await queryOne(
            'SELECT id, email, role FROM users WHERE email = ? LIMIT 1',
            [ADMIN_EMAIL]
        );

        if (existing) {
            console.log('User already exists. Updating role to admin and resetting password.');
            await query(
                'UPDATE users SET password = ?, role = ?, name = ? WHERE email = ?',
                [hashed, 'admin', ADMIN_NAME, ADMIN_EMAIL]
            );
            const updated = await queryOne('SELECT id, email, role FROM users WHERE email = ? LIMIT 1', [ADMIN_EMAIL]);
            console.log('User updated successfully:', { id: updated.id, email: updated.email, role: updated.role });
            process.exit(0);
        }

        // Insert new admin user
        console.log('Inserting new admin user...');
        const id = generateUUID();
        await query(
            'INSERT INTO users (id, name, email, password, phone, role) VALUES (?, ?, ?, ?, NULL, ?)',
            [id, ADMIN_NAME, ADMIN_EMAIL, hashed, 'admin']
        );

        console.log('Admin user created:', { id, email: ADMIN_EMAIL, role: 'admin' });
        console.log('\nYou can now login using:');
        console.log('  email: admin@gmail.com');
        console.log('  password: admin123');
        process.exit(0);
    } catch (err) {
        console.error('Fatal error:', err.message || err);
        process.exit(1);
    }
})();
