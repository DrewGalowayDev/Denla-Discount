const { query, queryOne, generateUUID } = require('../config/database');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res, next) => {
    try {
        const sql = `
            SELECT c.*, p.name as product_name, p.price, p.old_price, p.stock,
                   p.images, p.slug as product_slug, cat.name as category_name
            FROM cart c
            INNER JOIN products p ON c.product_id = p.id
            LEFT JOIN categories cat ON p.category_id = cat.id
            WHERE c.user_id = ? AND p.is_active = TRUE
        `;
        
        const cartItems = await query(sql, [req.user.id]);

        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        res.status(200).json({
            success: true,
            count: cartItems.length,
            subtotal,
            cart: cartItems
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res, next) => {
    try {
        const { product_id, quantity } = req.body;

        // Check if product exists and has stock
        const product = await queryOne('SELECT id, stock FROM products WHERE id = ? AND is_active = TRUE', [product_id]);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock'
            });
        }

        // Check if item already in cart
        const existing = await queryOne(
            'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
            [req.user.id, product_id]
        );

        if (existing) {
            // Update quantity
            const newQuantity = existing.quantity + quantity;
            if (product.stock < newQuantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient stock'
                });
            }
            
            await query(
                'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
                [newQuantity, req.user.id, product_id]
            );
        } else {
            // Add new item
            const cartId = generateUUID();
            await query(
                'INSERT INTO cart (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)',
                [cartId, req.user.id, product_id, quantity]
            );
        }

        res.status(200).json({
            success: true,
            message: 'Item added to cart'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:id
// @access  Private
exports.updateCartItem = async (req, res, next) => {
    try {
        const { quantity } = req.body;
        const cartItemId = req.params.id;

        // Get cart item with product stock info
        const cartItem = await queryOne(`
            SELECT c.*, p.stock
            FROM cart c
            INNER JOIN products p ON c.product_id = p.id
            WHERE c.id = ? AND c.user_id = ?
        `, [cartItemId, req.user.id]);

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        if (cartItem.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock'
            });
        }

        await query('UPDATE cart SET quantity = ? WHERE id = ?', [quantity, cartItemId]);

        res.status(200).json({
            success: true,
            message: 'Cart updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
exports.removeFromCart = async (req, res, next) => {
    try {
        await query('DELETE FROM cart WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

        res.status(200).json({
            success: true,
            message: 'Item removed from cart'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res, next) => {
    try {
        await query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        next(error);
    }
};
