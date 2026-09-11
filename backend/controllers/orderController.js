const { query, queryOne, generateUUID } = require('../config/database');

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
    try {
        const orders = await query(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );

        // Fetch order items for each order
        for (const order of orders) {
            order.order_items = await query(
                'SELECT oi.*, p.name as product_name, p.images as product_images FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
                [order.id]
            );
        }

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res, next) => {
    try {
        const order = await queryOne(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.order_items = await query(
            'SELECT oi.*, p.name as product_name, p.images as product_images FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
            [order.id]
        );

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
    try {
        const { items, shipping_address, payment_method, customer_notes } = req.body;

        if (!items || !items.length) {
            return res.status(400).json({
                success: false,
                message: 'No order items provided'
            });
        }

        // Calculate total and gather product snapshots
        let subtotal = 0;
        const enrichedItems = [];
        for (const item of items) {
            const product = await queryOne('SELECT id, name, price, images, sku, stock FROM products WHERE id = ?', [item.product_id]);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product ${item.product_id} not found`
                });
            }
            const itemPrice = parseFloat(product.price) || 0;
            const itemQty = parseInt(item.quantity) || 1;
            const itemTotal = itemPrice * itemQty;
            subtotal += itemTotal;

            enrichedItems.push({
                product_id: product.id,
                product_name: product.name,
                product_image: Array.isArray(product.images) ? product.images[0] : (product.images || ''),
                product_sku: product.sku || '',
                price: itemPrice,
                quantity: itemQty,
                subtotal: itemTotal
            });
        }

        const total_amount = subtotal;
        const orderId = generateUUID();
        const order_number = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Insert order
        await query(
            `INSERT INTO orders (id, user_id, order_number, subtotal, total_amount, shipping_address, payment_method, customer_notes, status, payment_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')`,
            [
                orderId,
                req.user.id,
                order_number,
                subtotal,
                total_amount,
                JSON.stringify(shipping_address || {}),
                payment_method || 'mpesa',
                customer_notes || null
            ]
        );

        // Insert order items
        for (const item of enrichedItems) {
            const itemId = generateUUID();
            await query(
                `INSERT INTO order_items (id, order_id, product_id, product_name, product_image, product_sku, price, quantity, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [itemId, orderId, item.product_id, item.product_name, item.product_image, item.product_sku, item.price, item.quantity, item.subtotal]
            );
        }

        // Clear cart
        await query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);

        const order = await queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
    try {
        await query(
            "UPDATE orders SET status = 'cancelled' WHERE id = ? AND user_id = ?",
            [req.params.id, req.user.id]
        );

        const order = await queryOne('SELECT * FROM orders WHERE id = ?', [req.params.id]);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Order cancelled',
            order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
exports.getAllOrders = async (req, res, next) => {
    try {
        const orders = await query(`
            SELECT o.*, u.name as user_name, u.email as user_email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);

        for (const order of orders) {
            order.order_items = await query(
                'SELECT oi.*, p.name as product_name FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
                [order.id]
            );
        }

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        await query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        const order = await queryOne('SELECT * FROM orders WHERE id = ?', [req.params.id]);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Order status updated',
            order
        });
    } catch (error) {
        next(error);
    }
};
