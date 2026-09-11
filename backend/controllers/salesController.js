const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Sales Controller for POS System
 * Handles sales transactions, returns, and sales management
 */

// Create a new sale (POS checkout)
exports.createSale = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const {
            customer_id,
            payment_method,
            subtotal,
            tax_amount,
            discount_amount,
            total_amount,
            amount_paid,
            change_given,
            notes,
            items
        } = req.body;

        // Validate required fields
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in sale' });
        }

        if (!payment_method || !total_amount) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Generate sale number
        const [lastSale] = await connection.query(
            'SELECT sale_number FROM sales ORDER BY created_at DESC LIMIT 1'
        );
        
        let saleNumber;
        if (lastSale.length > 0) {
            const lastNumber = parseInt(lastSale[0].sale_number.replace('SALE-', ''));
            saleNumber = `SALE-${String(lastNumber + 1).padStart(6, '0')}`;
        } else {
            saleNumber = 'SALE-000001';
        }

        // Insert sale
        const saleId = uuidv4();
        const [saleResult] = await connection.query(
            `INSERT INTO sales (
                id, sale_number, customer_id, cashier_id, 
                payment_method, subtotal, tax_amount, discount_amount, 
                total_amount, amount_paid, change_given, 
                status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)`,
            [
                saleId,
                saleNumber,
                customer_id || null,
                req.user.id,
                payment_method,
                subtotal,
                tax_amount || 0,
                discount_amount || 0,
                total_amount,
                amount_paid,
                change_given || 0,
                notes || null
            ]
        );

        // Insert sale items and update inventory
        for (const item of items) {
            const itemId = uuidv4();
            
            // Insert sale item
            await connection.query(
                `INSERT INTO sale_items (
                    id, sale_id, product_id, product_name, sku, barcode,
                    quantity, unit_price, cost_price, discount_amount,
                    tax_amount, subtotal
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    itemId,
                    saleId,
                    item.product_id,
                    item.product_name,
                    item.sku,
                    item.barcode || null,
                    item.quantity,
                    item.unit_price,
                    item.cost_price || 0,
                    item.discount_amount || 0,
                    item.tax_amount || 0,
                    item.subtotal
                ]
            );

            // Update product stock
            await connection.query(
                'UPDATE products SET current_stock = current_stock - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );

            // Log inventory transaction
            const transId = uuidv4();
            await connection.query(
                `INSERT INTO inventory_transactions (
                    id, product_id, transaction_type, quantity,
                    unit_cost, reference_type, reference_id, notes
                ) VALUES (?, ?, 'sale', ?, ?, 'sale', ?, ?)`,
                [
                    transId,
                    item.product_id,
                    -item.quantity,
                    item.cost_price || 0,
                    saleId,
                    `Sale ${saleNumber}`
                ]
            );
        }

        // Record cash register transaction
        const registerId = req.body.register_id || null;
        if (registerId) {
            const cashTransId = uuidv4();
            await connection.query(
                `INSERT INTO cash_register_transactions (
                    id, register_id, transaction_type, amount,
                    payment_method, reference_type, reference_id, notes
                ) VALUES (?, ?, 'sale', ?, ?, 'sale', ?, ?)`,
                [
                    cashTransId,
                    registerId,
                    total_amount,
                    payment_method,
                    saleId,
                    `Sale ${saleNumber}`
                ]
            );
        }

        await connection.commit();

        // Fetch complete sale details
        const [sale] = await connection.query(
            `SELECT s.*, 
                u.name as cashier_name,
                c.name as customer_name
            FROM sales s
            LEFT JOIN users u ON s.cashier_id = u.id
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.id = ?`,
            [saleId]
        );

        const [saleItems] = await connection.query(
            'SELECT * FROM sale_items WHERE sale_id = ?',
            [saleId]
        );

        res.status(201).json({
            message: 'Sale completed successfully',
            sale: sale[0],
            items: saleItems,
            sale_number: saleNumber
        });

    } catch (error) {
        await connection.rollback();
        console.error('Create sale error:', error);
        res.status(500).json({ 
            message: 'Failed to complete sale',
            error: error.message 
        });
    } finally {
        connection.release();
    }
};

// Get all sales with filters
exports.getSales = async (req, res) => {
    try {
        const {
            start_date,
            end_date,
            cashier_id,
            customer_id,
            payment_method,
            status,
            page = 1,
            limit = 50
        } = req.query;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (start_date) {
            whereClause += ' AND DATE(s.created_at) >= ?';
            params.push(start_date);
        }

        if (end_date) {
            whereClause += ' AND DATE(s.created_at) <= ?';
            params.push(end_date);
        }

        if (cashier_id) {
            whereClause += ' AND s.cashier_id = ?';
            params.push(cashier_id);
        }

        if (customer_id) {
            whereClause += ' AND s.customer_id = ?';
            params.push(customer_id);
        }

        if (payment_method) {
            whereClause += ' AND s.payment_method = ?';
            params.push(payment_method);
        }

        if (status) {
            whereClause += ' AND s.status = ?';
            params.push(status);
        }

        // Get total count
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM sales s ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        // Get sales
        const offset = (page - 1) * limit;
        const [sales] = await db.query(
            `SELECT s.*, 
                u.name as cashier_name,
                c.name as customer_name,
                c.phone as customer_phone,
                COUNT(si.id) as item_count
            FROM sales s
            LEFT JOIN users u ON s.cashier_id = u.id
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN sale_items si ON s.id = si.sale_id
            ${whereClause}
            GROUP BY s.id
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        res.json({
            sales,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch sales',
            error: error.message 
        });
    }
};

// Get single sale by ID
exports.getSaleById = async (req, res) => {
    try {
        const { id } = req.params;

        const [sales] = await db.query(
            `SELECT s.*, 
                u.name as cashier_name,
                u.email as cashier_email,
                c.name as customer_name,
                c.phone as customer_phone,
                c.email as customer_email
            FROM sales s
            LEFT JOIN users u ON s.cashier_id = u.id
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.id = ?`,
            [id]
        );

        if (sales.length === 0) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        const [items] = await db.query(
            'SELECT * FROM sale_items WHERE sale_id = ?',
            [id]
        );

        res.json({
            sale: sales[0],
            items
        });

    } catch (error) {
        console.error('Get sale error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch sale',
            error: error.message 
        });
    }
};

// Get sales report/summary
exports.getSalesReport = async (req, res) => {
    try {
        const { start_date, end_date, cashier_id } = req.query;

        let whereClause = 'WHERE s.status = "completed"';
        const params = [];

        if (start_date) {
            whereClause += ' AND DATE(s.created_at) >= ?';
            params.push(start_date);
        }

        if (end_date) {
            whereClause += ' AND DATE(s.created_at) <= ?';
            params.push(end_date);
        }

        if (cashier_id) {
            whereClause += ' AND s.cashier_id = ?';
            params.push(cashier_id);
        }

        // Summary statistics
        const [summary] = await db.query(
            `SELECT 
                COUNT(*) as total_sales,
                SUM(s.total_amount) as total_revenue,
                SUM(s.subtotal) as total_subtotal,
                SUM(s.tax_amount) as total_tax,
                SUM(s.discount_amount) as total_discount,
                AVG(s.total_amount) as average_sale,
                SUM(CASE WHEN s.payment_method = 'cash' THEN s.total_amount ELSE 0 END) as cash_sales,
                SUM(CASE WHEN s.payment_method = 'mpesa' THEN s.total_amount ELSE 0 END) as mpesa_sales,
                SUM(CASE WHEN s.payment_method = 'card' THEN s.total_amount ELSE 0 END) as card_sales
            FROM sales s
            ${whereClause}`,
            params
        );

        // Sales by cashier
        const [byCashier] = await db.query(
            `SELECT 
                u.name as cashier_name,
                COUNT(*) as sale_count,
                SUM(s.total_amount) as total_amount
            FROM sales s
            LEFT JOIN users u ON s.cashier_id = u.id
            ${whereClause}
            GROUP BY s.cashier_id
            ORDER BY total_amount DESC`,
            params
        );

        // Top selling products
        const [topProducts] = await db.query(
            `SELECT 
                si.product_name,
                si.sku,
                SUM(si.quantity) as total_quantity,
                SUM(si.subtotal) as total_revenue
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            ${whereClause}
            GROUP BY si.product_id
            ORDER BY total_quantity DESC
            LIMIT 10`,
            params
        );

        // Sales by hour (for today or selected date)
        const [byHour] = await db.query(
            `SELECT 
                HOUR(s.created_at) as hour,
                COUNT(*) as sale_count,
                SUM(s.total_amount) as total_amount
            FROM sales s
            ${whereClause}
            GROUP BY HOUR(s.created_at)
            ORDER BY hour`,
            params
        );

        res.json({
            summary: summary[0],
            by_cashier: byCashier,
            top_products: topProducts,
            by_hour: byHour
        });

    } catch (error) {
        console.error('Sales report error:', error);
        res.status(500).json({ 
            message: 'Failed to generate sales report',
            error: error.message 
        });
    }
};

// Void/Cancel a sale (requires admin/manager)
exports.voidSale = async (req, res) => {
    const connection = await db.getConnection();

    try {
        // Check permission
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        await connection.beginTransaction();

        const { id } = req.params;
        const { reason } = req.body;

        // Get sale details
        const [sales] = await connection.query(
            'SELECT * FROM sales WHERE id = ?',
            [id]
        );

        if (sales.length === 0) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        const sale = sales[0];

        if (sale.status === 'void') {
            return res.status(400).json({ message: 'Sale already voided' });
        }

        // Get sale items
        const [items] = await connection.query(
            'SELECT * FROM sale_items WHERE sale_id = ?',
            [id]
        );

        // Restore stock for each item
        for (const item of items) {
            await connection.query(
                'UPDATE products SET current_stock = current_stock + ? WHERE id = ?',
                [item.quantity, item.product_id]
            );

            // Log inventory restoration
            const transId = uuidv4();
            await connection.query(
                `INSERT INTO inventory_transactions (
                    id, product_id, transaction_type, quantity,
                    reference_type, reference_id, notes
                ) VALUES (?, ?, 'adjustment', ?, 'sale_void', ?, ?)`,
                [
                    transId,
                    item.product_id,
                    item.quantity,
                    id,
                    `Void sale ${sale.sale_number}: ${reason}`
                ]
            );
        }

        // Update sale status
        await connection.query(
            'UPDATE sales SET status = "void", notes = CONCAT(COALESCE(notes, ""), " | VOIDED: ", ?) WHERE id = ?',
            [reason || 'No reason provided', id]
        );

        await connection.commit();

        res.json({
            message: 'Sale voided successfully',
            sale_number: sale.sale_number
        });

    } catch (error) {
        await connection.rollback();
        console.error('Void sale error:', error);
        res.status(500).json({ 
            message: 'Failed to void sale',
            error: error.message 
        });
    } finally {
        connection.release();
    }
};

module.exports = exports;
