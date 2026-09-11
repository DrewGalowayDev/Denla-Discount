// Auth API — MySQL version
const { query, queryOne, generateUUID } = require('../../backend/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const { setCorsHeaders, handleOptions } = require('../_utils/cors');

function createEmailTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'awesome1technologies@gmail.com',
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });
}

async function sendResetEmail(email, resetCode, userName) {
    if (!process.env.GMAIL_APP_PASSWORD) {
        return { sent: false, code: resetCode };
    }
    const transporter = createEmailTransporter();
    const mailOptions = {
        from: '"Awesome Technologies" <awesome1technologies@gmail.com>',
        to: email,
        subject: 'Password Reset Code - Awesome Technologies',
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                <div style="background:#1a1a2e;color:white;padding:40px 30px;text-align:center;">
                    <h1 style="margin:0;">🔐 Password Reset Code</h1>
                </div>
                <div style="background:#fff;padding:40px 30px;">
                    <p>Hello ${userName || 'there'},</p>
                    <p>Your password reset code is:</p>
                    <div style="background:#f8f9fa;border:2px dashed #333;border-radius:10px;padding:30px;text-align:center;margin:30px 0;">
                        <div style="font-size:42px;font-weight:bold;letter-spacing:8px;font-family:'Courier New',monospace;">${resetCode}</div>
                    </div>
                    <p>This code expires in <strong>10 minutes</strong>. Never share it with anyone.</p>
                    <p>Best regards,<br><strong>The Awesome Technologies Team</strong></p>
                </div>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
        return { sent: true };
    } catch (error) {
        return { sent: false, error: error.message, code: resetCode };
    }
}

module.exports = async (req, res) => {
    setCorsHeaders(res, req);
    if (handleOptions(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const path = req.url.split('?')[0];

    // Google OAuth
    if (path.includes('/google')) {
        const { googleToken, profile } = req.body;
        if (!googleToken || !profile) {
            return res.status(400).json({ success: false, message: 'Google token and profile are required' });
        }
        try {
            let user = await queryOne('SELECT * FROM users WHERE google_id = ? LIMIT 1', [profile.sub]);
            if (!user) {
                user = await queryOne('SELECT * FROM users WHERE email = ? LIMIT 1', [profile.email]);
                if (user) {
                    await query(
                        'UPDATE users SET google_id = ?, avatar_url = ?, email_verified = ? WHERE id = ?',
                        [profile.sub, profile.picture, profile.email_verified ? 1 : 0, user.id]
                    );
                    user = await queryOne('SELECT * FROM users WHERE id = ? LIMIT 1', [user.id]);
                } else {
                    const id = generateUUID();
                    await query(
                        'INSERT INTO users (id, email, name, google_id, avatar_url, email_verified, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [id, profile.email, profile.name, profile.sub, profile.picture, profile.email_verified ? 1 : 0, 'user']
                    );
                    user = await queryOne('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
                }
            }
            const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
            return res.status(200).json({ success: true, token, user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar_url: user.avatar_url } });
        } catch (error) {
            console.error('Google sign-in error:', error);
            return res.status(500).json({ success: false, message: 'Failed to authenticate with Google', error: error.message });
        }
    }

    // Forgot password
    if (path.includes('/forgot-password')) {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
        try {
            const user = await queryOne('SELECT id, email, name FROM users WHERE email = ? LIMIT 1', [email]);
            if (!user) {
                return res.status(200).json({ success: true, message: 'If an account exists with this email, a password reset code has been sent.' });
            }
            const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
            const resetCodeExpiry = new Date(Date.now() + 600000);
            await query(
                'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
                [resetCode, resetCodeExpiry, user.id]
            );
            const emailResult = await sendResetEmail(user.email, resetCode, user.name);
            if (emailResult.sent) {
                return res.status(200).json({ success: true, message: 'A 6-digit reset code has been sent to your email.' });
            } else {
                return res.status(200).json({
                    success: true,
                    message: 'Reset code generated.',
                    resetCode,
                    note: 'Email service not configured. Use this code to reset password (expires in 10 minutes).'
                });
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            return res.status(500).json({ success: false, message: 'Failed to process password reset request', error: error.message });
        }
    }

    // Change password
    if (path.includes('/change-password')) {
        const { currentPassword, newPassword } = req.body;
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        try {
            const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ success: false, message: 'Current password and new password are required' });
            }
            if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
            if (currentPassword === newPassword) return res.status(400).json({ success: false, message: 'New password must be different from current password' });

            const user = await queryOne('SELECT id, email, password, role FROM users WHERE id = ? LIMIT 1', [decoded.userId]);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });

            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
            return res.status(200).json({ success: true, message: 'Password changed successfully' });
        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: 'Invalid or expired session. Please login again.' });
            }
            console.error('Change password error:', error);
            return res.status(500).json({ success: false, message: 'Failed to change password', error: error.message });
        }
    }

    // Reset password
    if (path.includes('/reset-password')) {
        const { code, newPassword, email } = req.body;
        if (!code || !newPassword || !email) {
            return res.status(400).json({ success: false, message: 'Email, code and new password are required' });
        }
        if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        try {
            const user = await queryOne(
                'SELECT id, email, reset_token, reset_token_expiry FROM users WHERE email = ? AND reset_token = ? LIMIT 1',
                [email, code]
            );
            if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });

            if (new Date(user.reset_token_expiry) < new Date()) {
                return res.status(400).json({ success: false, message: 'Reset code has expired. Please request a new one.' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?', [hashedPassword, user.id]);
            return res.status(200).json({ success: true, message: 'Password has been reset successfully. You can now login with your new password.' });
        } catch (error) {
            console.error('Reset password error:', error);
            return res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
        }
    }

    // Login
    if (path.includes('/login')) {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email or username and password are required' });
        }
        try {
            const isEmail = email.includes('@');
            let user;
            if (isEmail) {
                user = await queryOne('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
            } else {
                user = await queryOne('SELECT * FROM users WHERE LOWER(name) = LOWER(?) LIMIT 1', [email]);
            }
            if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

            const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
            return res.status(200).json({ success: true, message: 'Login successful', token, user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar_url: user.avatar_url } });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ success: false, message: 'Login failed. Please try again.', error: error.message });
        }
    }

    // Fallback signup/login
    const { action, email, password, name } = req.body;
    const authAction = action || (email && password ? 'login' : null);
    if (!authAction || !email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    try {
        if (authAction === 'signup') {
            const existing = await queryOne('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
            if (existing) return res.status(409).json({ success: false, message: 'User already exists' });

            const hashedPassword = await bcrypt.hash(password, 10);
            const id = generateUUID();
            await query(
                'INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
                [id, email, hashedPassword, name || email.split('@')[0], 'user']
            );
            const newUser = await queryOne('SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1', [id]);
            const token = jwt.sign({ userId: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
            return res.status(201).json({ success: true, message: 'User created successfully', token, user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role } });
        } else if (authAction === 'login') {
            const user = await queryOne('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
            if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

            const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
            return res.status(200).json({ success: true, message: 'Login successful', token, user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar_url: user.avatar_url } });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};