const { query, queryOne } = require('../config/database');

// @desc    Get all users (Admin)
// @route   GET /api/users/admin/all
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
    try {
        const sql = `
            SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at, u.last_login,
                   COUNT(DISTINCT o.id) as total_orders,
                   COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) as total_spent
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            WHERE u.role = 'customer'
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `;
        
        const users = await query(sql);

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user by ID (Admin)
// @route   GET /api/users/admin/:id
// @access  Private/Admin
exports.getUserById = async (req, res, next) => {
    try {
        const user = await queryOne(
            'SELECT id, name, email, phone, role, is_active, created_at, last_login FROM users WHERE id = ?',
            [req.params.id]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user stats
        const stats = await queryOne(`
            SELECT 
                COUNT(DISTINCT o.id) as total_orders,
                COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) as total_spent,
                (SELECT COUNT(*) FROM wishlist WHERE user_id = ?) as wishlist_count
            FROM orders o
            WHERE o.user_id = ?
        `, [req.params.id, req.params.id]);

        user.stats = stats;

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
exports.getProfile = async (req, res, next) => {
    try {
        const user = await queryOne(
            'SELECT id, name, email, phone, avatar, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        const { name, phone, avatar } = req.body;

        await query(
            'UPDATE users SET name = ?, phone = ?, avatar = ? WHERE id = ?',
            [name, phone, avatar || null, req.user.id]
        );

        const user = await queryOne(
            'SELECT id, name, email, phone, avatar, role FROM users WHERE id = ?',
            [req.user.id]
        );

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Deactivate user (Admin)
// @route   PUT /api/users/admin/:id/deactivate
// @access  Private/Admin
exports.deactivateUser = async (req, res, next) => {
    try {
        await query('UPDATE users SET is_active = FALSE WHERE id = ?', [req.params.id]);

        res.status(200).json({
            success: true,
            message: 'User deactivated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Activate user (Admin)
// @route   PUT /api/users/admin/:id/activate
// @access  Private/Admin
exports.activateUser = async (req, res, next) => {
    try {
        await query('UPDATE users SET is_active = TRUE WHERE id = ?', [req.params.id]);

        res.status(200).json({
            success: true,
            message: 'User activated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user (Admin)
// @route   DELETE /api/users/admin/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
    try {
        await query('DELETE FROM users WHERE id = ? AND role != ?', [req.params.id, 'admin']);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user (Admin)
exports.updateUser = async (req, res, next) => {
    try {
        const { name, email, role } = req.body;
        await query(
            'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), role = COALESCE(?, role) WHERE id = ?',
            [name || null, email || null, role || null, req.params.id]
        );
        const user = await queryOne('SELECT id, name, email, role FROM users WHERE id = ?', [req.params.id]);
        res.status(200).json({ success: true, message: 'User updated', user });
    } catch (error) {
        next(error);
    }
};

// @desc    Add address
exports.addAddress = async (req, res, next) => {
    try {
        res.status(200).json({ success: true, message: 'Address saved' });
    } catch (error) {
        next(error);
    }
};

// @desc    Update address
exports.updateAddress = async (req, res, next) => {
    try {
        res.status(200).json({ success: true, message: 'Address updated' });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete address
exports.deleteAddress = async (req, res, next) => {
    try {
        res.status(200).json({ success: true, message: 'Address deleted' });
    } catch (error) {
        next(error);
    }
};
