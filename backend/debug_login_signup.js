// Debug login/signup script — MySQL version
// Run this in the backend folder: node debug_login_signup.js

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { query, queryOne } = require('./config/database');

const app = express();
app.use(cors());
app.use(express.json());

// Debug endpoint to check admin user
app.get('/debug/check-admin', async (req, res) => {
    try {
        const user = await queryOne(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            ['admin@awesometech.co.ke']
        );

        if (!user) {
            return res.json({
                exists: false,
                message: 'Admin user does NOT exist in database'
            });
        }

        const testPassword = 'awesometech254';
        const passwordMatch = await bcrypt.compare(testPassword, user.password);

        res.json({
            exists: true,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            passwordMatch,
            message: passwordMatch ? 'Admin credentials are CORRECT' : 'Password does NOT match'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Debug signup
app.post('/debug/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const existing = await queryOne('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
        if (existing) return res.json({ success: false, message: 'User already exists' });

        const hashed = await bcrypt.hash(password, 10);
        const { generateUUID } = require('./config/database');
        const id = generateUUID();
        await query(
            'INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
            [id, email, hashed, name || email.split('@')[0], 'user']
        );
        res.json({ success: true, message: 'User created', id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Debug server running on http://localhost:${PORT}`);
    console.log('Test: GET http://localhost:5001/debug/check-admin');
});
