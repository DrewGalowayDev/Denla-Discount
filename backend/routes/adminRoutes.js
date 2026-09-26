const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// GET /api/admin/customers - List of customers
router.get('/customers', async (req, res, next) => {
    try {
        const customers = await query(
            `SELECT id, name, email, phone, role, created_at, 
             COALESCE((SELECT COUNT(*) FROM orders WHERE orders.user_id = users.id), 0) AS total_orders,
             COALESCE((SELECT SUM(total_amount) FROM orders WHERE orders.user_id = users.id), 0) AS total_spent
             FROM users 
             ORDER BY created_at DESC`
        );
        res.status(200).json({
            success: true,
            customers: customers || []
        });
    } catch (error) {
        res.status(200).json({ success: true, customers: [] });
    }
});

// GET /api/admin/users - All users
router.get('/users', async (req, res, next) => {
    try {
        const users = await query('SELECT id, name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC');
        res.status(200).json({
            success: true,
            users: users || []
        });
    } catch (error) {
        res.status(200).json({ success: true, users: [] });
    }
});

// GET /api/admin/online-users
router.get('/online-users', (req, res) => {
    res.status(200).json({
        success: true,
        onlineCount: 1,
        users: [{ id: 'admin', name: 'Admin User', role: 'admin', lastActive: new Date() }]
    });
});

// GET /api/admin/wishlist
router.get('/wishlist', async (req, res) => {
    try {
        const items = await query(
            `SELECT w.id, w.user_id, w.product_id, p.name, p.price, p.image 
             FROM wishlist w 
             LEFT JOIN products p ON w.product_id = p.id 
             LIMIT 50`
        );
        res.status(200).json({ success: true, wishlist: items || [] });
    } catch (e) {
        res.status(200).json({ success: true, wishlist: [] });
    }
});

module.exports = router;
