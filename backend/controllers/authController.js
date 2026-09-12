const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne, generateUUID } = require('../config/database');
const { findByField, updateById } = require('../utils/dbHelpers');

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email and password'
            });
        }

        // Check if user exists
        const existingUser = await findByField('users', 'email', email);

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Split name into first_name and last_name
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        // Create user with UUID
        const userId = generateUUID();
        await query(
            `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, email, hashedPassword, firstName, lastName, phone || null, 'customer']
        );

        // Get created user
        const user = await queryOne('SELECT id, first_name, last_name, email, role FROM users WHERE id = ?', [userId]);

        // Generate token
        const token = generateToken(user.id);

        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                name: fullName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Get user by email (using password_hash column)
        const user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated'
            });
        }

        // Check password (using password_hash column)
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login (if column exists)
        try {
            await query('UPDATE users SET updated_at = NOW() WHERE id = ?', [user.id]);
        } catch (err) {
            // Ignore if last_login column doesn't exist
        }

        // Generate token
        const token = generateToken(user.id);

        // Combine first_name and last_name for name
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: fullName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await queryOne(
            'SELECT id, first_name, last_name, email, phone, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

        res.status(200).json({
            success: true,
            user: {
                ...user,
                name: fullName
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        const { name, phone } = req.body;

        // Split name into first_name and last_name
        const nameParts = (name || '').trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        await query(
            'UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?',
            [firstName, lastName, phone, req.user.id]
        );

        const user = await queryOne(
            'SELECT id, first_name, last_name, email, phone, role FROM users WHERE id = ?',
            [req.user.id]
        );

        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                ...user,
                name: fullName
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Get user with password_hash
        const user = await queryOne(
            'SELECT password_hash FROM users WHERE id = ?',
            [req.user.id]
        );

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password_hash
        await query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hashedPassword, req.user.id]
        );

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    try {
        // TODO: Implement forgot password logic with email
        res.status(200).json({
            success: true,
            message: 'Password reset email sent'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
    try {
        // TODO: Implement reset password logic
        res.status(200).json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res, next) => {
    try {
        // TODO: Implement email verification
        res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res, next) => {
    try {
        // TODO: Implement resend verification
        res.status(200).json({
            success: true,
            message: 'Verification email sent'
        });
    } catch (error) {
        next(error);
    }
};
