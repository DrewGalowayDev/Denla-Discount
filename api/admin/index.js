// Admin API (directory index) — MySQL version
const { query } = require('../../backend/config/database');
const { setCorsHeaders, handleOptions } = require('../_utils/cors');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'N8J3VJy23YmMifhOE0ai7g7AWuiOP9BYmxDaB1gU0pY=';

function verifyAdmin(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    try {
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            decoded = jwt.verify(token, 'your-secret-key-change-this');
        }
        const role = (decoded.role || '').toLowerCase();
        const allowedRoles = ['admin', 'manager', 'inventory_clerk', 'cashier'];
        if (!allowedRoles.includes(role)) return null;
        return decoded;
    } catch (error) {
        return null;
    }
}

module.exports = async (req, res) => {
    setCorsHeaders(res, req);
    if (handleOptions(req, res)) return;

    const admin = verifyAdmin(req);
    if (!admin) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const path = req.url.split('?')[0];

    try {
        if (path.includes('/users') && req.method === 'GET') {
            const users = await query('SELECT id, email, name, role, created_at, avatar_url FROM users ORDER BY created_at DESC');
            return res.status(200).json({ success: true, users: users || [] });
        }

        if (path.includes('/activity') && req.method === 'GET') {
            return res.status(200).json({ success: true, activity: [], onlineUsers: [] });
        }

        if (path.includes('/wishlist') && req.method === 'GET') {
            const wishlist = await query('SELECT id, user_id, product_id, created_at FROM wishlist ORDER BY created_at DESC');
            return res.status(200).json({ success: true, wishlist: wishlist || [] });
        }

        if (path.includes('/orders') && req.method === 'GET') {
            const orders = await query('SELECT id, user_id, total_amount, status, created_at FROM orders ORDER BY created_at DESC');
            return res.status(200).json({ success: true, orders: orders || [] });
        }

        if (path.includes('/customers') && req.method === 'GET') {
            const customers = await query(
                "SELECT id, email, name, created_at, avatar_url FROM users WHERE role = 'user' ORDER BY created_at DESC"
            );
            return res.status(200).json({ success: true, customers: customers || [] });
        }

        if (path.includes('/online-users') && req.method === 'GET') {
            return res.status(200).json({ success: true, onlineUsers: [] });
        }

        return res.status(404).json({ success: false, message: 'Endpoint not found' });
    } catch (error) {
        console.error('Admin API error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};