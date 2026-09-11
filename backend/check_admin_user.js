require('dotenv').config();
const { query } = require('./config/database');

(async () => {
    try {
        const email = 'admin@awesometech.co.ke';
        console.log('MySQL DB:', process.env.DB_NAME || 'denla');
        console.log('Querying users table for:', email);

        const rows = await query(
            'SELECT id, name, email, role, created_at FROM users WHERE email = ? LIMIT 1',
            [email]
        );

        if (!rows || rows.length === 0) {
            console.log('No user found with that email.');
            process.exit(0);
        }

        console.log('User record found:');
        console.log(JSON.stringify(rows[0], null, 2));
    } catch (err) {
        console.error('Error:', err.message || err);
        process.exit(1);
    }
})();
