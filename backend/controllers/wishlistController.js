const { query, queryOne, generateUUID } = require('../config/database');

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res, next) => {
    try {
        const sql = `
            SELECT w.*, p.name as product_name, p.price, p.old_price, p.stock,
                   p.images, p.slug as product_slug, cat.name as category_name
            FROM wishlist w
            INNER JOIN products p ON w.product_id = p.id
            LEFT JOIN categories cat ON p.category_id = cat.id
            WHERE w.user_id = ?
            ORDER BY w.created_at DESC
        `;

        const wishlist = await query(sql, [req.user.id]);

        res.status(200).json({
            success: true,
            count: wishlist.length,
            wishlist
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add to wishlist
// @route   POST /api/wishlist/add
// @access  Private
exports.addToWishlist = async (req, res, next) => {
    try {
        const { product_id } = req.body;

        if (!product_id) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        // Check if product exists
        const product = await queryOne('SELECT id FROM products WHERE id = ?', [product_id]);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if already in wishlist
        const existing = await queryOne(
            'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
            [req.user.id, product_id]
        );

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Product already in wishlist'
            });
        }

        const id = generateUUID();
        await query(
            'INSERT INTO wishlist (id, user_id, product_id) VALUES (?, ?, ?)',
            [id, req.user.id, product_id]
        );

        const wishlistItem = await queryOne('SELECT * FROM wishlist WHERE id = ?', [id]);

        res.status(201).json({
            success: true,
            message: 'Added to wishlist',
            wishlistItem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove from wishlist
// @route   DELETE /api/wishlist/remove/:productId
// @access  Private
exports.removeFromWishlist = async (req, res, next) => {
    try {
        await query(
            'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
            [req.user.id, req.params.productId]
        );

        res.status(200).json({
            success: true,
            message: 'Removed from wishlist'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Clear wishlist
// @route   DELETE /api/wishlist/clear
// @access  Private
exports.clearWishlist = async (req, res, next) => {
    try {
        await query('DELETE FROM wishlist WHERE user_id = ?', [req.user.id]);

        res.status(200).json({
            success: true,
            message: 'Wishlist cleared'
        });
    } catch (error) {
        next(error);
    }
};
