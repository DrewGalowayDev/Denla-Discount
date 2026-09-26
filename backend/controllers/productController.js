const { query, queryOne, generateUUID } = require('../config/database');
const { getPaginated, findById, updateById, deleteById } = require('../utils/dbHelpers');

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000;
        const sort = req.query.sort || 'created_at';
        const order = req.query.order || 'DESC';
        
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await queryOne('SELECT COUNT(*) as total FROM products WHERE is_active = TRUE');
        const total = countResult.total;

        // Get products with categories
        const sql = `
            SELECT p.*, 
                   COALESCE(NULLIF(p.price, 0), NULLIF(p.selling_price, 0), p.price, 0) as price,
                   COALESCE(NULLIF(p.old_price, 0), NULLIF(p.cost_price, 0), p.old_price) as old_price,
                   COALESCE(p.stock, p.current_stock, 0) as stock,
                   c.name as category_name, 
                   c.slug as category_slug, 
                   c.icon as category_icon, 
                   c.color as category_color
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = TRUE
            ORDER BY p.${sort} ${order}
            LIMIT ? OFFSET ?
        `;
        
        const products = await query(sql, [limit, offset]);

        res.status(200).json({
            success: true,
            count: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            products
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Search products
// @route   GET /api/products/search?q=keyword
// @access  Public
exports.searchProducts = async (req, res, next) => {
    try {
        const { q } = req.query;

        const sql = `
            SELECT p.*, 
                   COALESCE(NULLIF(p.price, 0), NULLIF(p.selling_price, 0), p.price, 0) as price,
                   COALESCE(NULLIF(p.old_price, 0), NULLIF(p.cost_price, 0), p.old_price) as old_price,
                   COALESCE(p.stock, p.current_stock, 0) as stock,
                   c.name as category_name, 
                   c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE (p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)
            AND p.is_active = TRUE
        `;
        
        const searchTerm = `%${q}%`;
        const products = await query(sql, [searchTerm, searchTerm, searchTerm]);

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Filter products
// @route   GET /api/products/filter
// @access  Public
exports.filterProducts = async (req, res, next) => {
    try {
        const { 
            minPrice, 
            maxPrice, 
            brand, 
            condition, 
            category, 
            inStock 
        } = req.query;

        let sql = `
            SELECT p.*, 
                   COALESCE(NULLIF(p.price, 0), NULLIF(p.selling_price, 0), p.price, 0) as price,
                   COALESCE(NULLIF(p.old_price, 0), NULLIF(p.cost_price, 0), p.old_price) as old_price,
                   COALESCE(p.stock, p.current_stock, 0) as stock,
                   c.name as category_name, 
                   c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = TRUE
        `;
        
        const params = [];

        if (minPrice) {
            sql += ' AND COALESCE(NULLIF(p.price, 0), p.selling_price, 0) >= ?';
            params.push(parseFloat(minPrice));
        }
        if (maxPrice) {
            sql += ' AND COALESCE(NULLIF(p.price, 0), p.selling_price, 0) <= ?';
            params.push(parseFloat(maxPrice));
        }
        if (brand) {
            sql += ' AND p.brand = ?';
            params.push(brand);
        }
        if (condition) {
            sql += ' AND p.condition = ?';
            params.push(condition);
        }
        if (category) {
            sql += ' AND p.category_id = ?';
            params.push(category);
        }
        if (inStock) {
            sql += ' AND COALESCE(p.stock, p.current_stock, 0) > 0';
        }

        const products = await query(sql, params);

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res, next) => {
    try {
        // Get product with category
        const productSql = `
            SELECT p.*, 
                   COALESCE(NULLIF(p.price, 0), NULLIF(p.selling_price, 0), p.price, 0) as price,
                   COALESCE(NULLIF(p.old_price, 0), NULLIF(p.cost_price, 0), p.old_price) as old_price,
                   COALESCE(p.stock, p.current_stock, 0) as stock,
                   c.name as category_name, 
                   c.slug as category_slug, 
                   c.icon as category_icon
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ? AND p.is_active = TRUE
        `;
        const product = await queryOne(productSql, [req.params.id]);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Get reviews for this product
        const reviewsSql = `
            SELECT r.*, u.name as user_name, u.email as user_email
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.product_id = ? AND r.is_approved = TRUE
            ORDER BY r.created_at DESC
        `;
        const reviews = await query(reviewsSql, [req.params.id]);
        product.reviews = reviews;

        // Increment views count
        await query('UPDATE products SET views_count = views_count + 1 WHERE id = ?', [req.params.id]);

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
exports.getProductsByCategory = async (req, res, next) => {
    try {
        const sql = `
            SELECT p.*, 
                   COALESCE(NULLIF(p.price, 0), NULLIF(p.selling_price, 0), p.price, 0) as price,
                   COALESCE(NULLIF(p.old_price, 0), NULLIF(p.cost_price, 0), p.old_price) as old_price,
                   COALESCE(p.stock, p.current_stock, 0) as stock,
                   c.name as category_name, 
                   c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.category_id = ? AND p.is_active = TRUE
            ORDER BY p.created_at DESC
        `;
        
        const products = await query(sql, [req.params.categoryId]);

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get products by brand
// @route   GET /api/products/brand/:brand
// @access  Public
exports.getProductsByBrand = async (req, res, next) => {
    try {
        const sql = `
            SELECT p.*, 
                   COALESCE(NULLIF(p.price, 0), NULLIF(p.selling_price, 0), p.price, 0) as price,
                   COALESCE(NULLIF(p.old_price, 0), NULLIF(p.cost_price, 0), p.old_price) as old_price,
                   COALESCE(p.stock, p.current_stock, 0) as stock,
                   c.name as category_name, 
                   c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.brand = ? AND p.is_active = TRUE
            ORDER BY p.created_at DESC
        `;
        
        const products = await query(sql, [req.params.brand]);

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res, next) => {
    try {
        const sql = `
            SELECT p.*, 
                   COALESCE(NULLIF(p.price, 0), NULLIF(p.selling_price, 0), p.price, 0) as price,
                   COALESCE(NULLIF(p.old_price, 0), NULLIF(p.cost_price, 0), p.old_price) as old_price,
                   COALESCE(p.stock, p.current_stock, 0) as stock,
                   c.name as category_name, 
                   c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_featured = TRUE AND p.is_active = TRUE
            ORDER BY p.created_at DESC
            LIMIT 8
        `;
        
        const products = await query(sql);

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get deal products
// @route   GET /api/products/deals
// @access  Public
exports.getDealsProducts = async (req, res, next) => {
    try {
        const sql = `
            SELECT p.*, 
                   COALESCE(NULLIF(p.price, 0), NULLIF(p.selling_price, 0), p.price, 0) as price,
                   COALESCE(NULLIF(p.old_price, 0), NULLIF(p.cost_price, 0), p.old_price) as old_price,
                   COALESCE(p.stock, p.current_stock, 0) as stock,
                   c.name as category_name, 
                   c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE (p.old_price IS NOT NULL OR p.cost_price IS NOT NULL OR p.is_deal = TRUE) AND p.is_active = TRUE
            ORDER BY (COALESCE(p.old_price, p.cost_price, 0) - COALESCE(p.price, p.selling_price, 0)) DESC
            LIMIT 8
        `;
        
        const products = await query(sql);

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get new arrivals
// @route   GET /api/products/new-arrivals
// @access  Public
exports.getNewArrivals = async (req, res, next) => {
    try {
        const sql = `
            SELECT p.*, 
                   COALESCE(NULLIF(p.price, 0), NULLIF(p.selling_price, 0), p.price, 0) as price,
                   COALESCE(NULLIF(p.old_price, 0), NULLIF(p.cost_price, 0), p.old_price) as old_price,
                   COALESCE(p.stock, p.current_stock, 0) as stock,
                   c.name as category_name, 
                   c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = TRUE
            ORDER BY p.created_at DESC
            LIMIT 8
        `;
        
        const products = await query(sql);

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create product (Admin)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
    try {
        const productData = req.body;
        const productId = generateUUID();

        // Prepare data
        const {
            name,
            slug,
            description,
            specifications,
            price,
            old_price,
            brand,
            condition,
            stock,
            low_stock_threshold,
            sku,
            images,
            category_id,
            is_featured,
            is_deal,
            is_new_arrival,
            meta_title,
            meta_description,
            meta_keywords
        } = productData;

        const numPrice = parseFloat(price) || 0;
        const numOldPrice = old_price ? parseFloat(old_price) : null;
        const numStock = parseInt(stock, 10) || 0;

        const sql = `
            INSERT INTO products (
                id, name, slug, description, specifications, price, selling_price, old_price, cost_price, brand, \`condition\`,
                stock, current_stock, low_stock_threshold, sku, images, category_id, is_featured, is_deal,
                is_new_arrival, meta_title, meta_description, meta_keywords, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        `;

        await query(sql, [
            productId, name, slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
            description || '',
            specifications ? JSON.stringify(specifications) : null,
            numPrice, numPrice, numOldPrice, numOldPrice, brand || '', condition || 'new',
            numStock, numStock, low_stock_threshold || 10, sku || null,
            images ? JSON.stringify(images) : null,
            category_id || null, is_featured || false, is_deal || false,
            is_new_arrival || false, meta_title || null, meta_description || null, meta_keywords || null
        ]);

        const product = await findById('products', productId);

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
    try {
        const updateData = { ...req.body };
        
        // Convert specifications and images to JSON strings if they are objects/arrays
        if (updateData.specifications && typeof updateData.specifications === 'object') {
            updateData.specifications = JSON.stringify(updateData.specifications);
        }
        if (updateData.images && typeof updateData.images === 'object') {
            updateData.images = JSON.stringify(updateData.images);
        }

        // Synchronize twin columns so updates are consistent across the entire database
        if (updateData.price !== undefined) {
            updateData.price = parseFloat(updateData.price) || 0;
            updateData.selling_price = updateData.price;
        } else if (updateData.selling_price !== undefined) {
            updateData.selling_price = parseFloat(updateData.selling_price) || 0;
            updateData.price = updateData.selling_price;
        }

        if (updateData.stock !== undefined) {
            updateData.stock = parseInt(updateData.stock, 10) || 0;
            updateData.current_stock = updateData.stock;
        } else if (updateData.current_stock !== undefined) {
            updateData.current_stock = parseInt(updateData.current_stock, 10) || 0;
            updateData.stock = updateData.current_stock;
        }

        if (updateData.old_price !== undefined) {
            updateData.old_price = updateData.old_price ? parseFloat(updateData.old_price) : null;
            updateData.cost_price = updateData.old_price;
        } else if (updateData.cost_price !== undefined) {
            updateData.cost_price = updateData.cost_price ? parseFloat(updateData.cost_price) : null;
            updateData.old_price = updateData.cost_price;
        }

        // Whitelist of valid product columns to prevent SQL errors from unknown fields
        const validColumns = [
            'name', 'sku', 'barcode', 'category_id', 'description', 'unit_of_measure',
            'cost_price', 'selling_price', 'wholesale_price', 'minimum_price',
            'current_stock', 'minimum_stock', 'maximum_stock', 'reorder_quantity',
            'is_active', 'is_taxable', 'tax_rate', 'has_expiry', 'default_supplier_id',
            'image', 'notes', 'views_count', 'is_featured', 'is_deal', 'is_new_arrival',
            'brand', 'low_stock_threshold', 'specifications', 'meta_title',
            'meta_description', 'meta_keywords', 'slug', 'price', 'old_price',
            'stock', 'images', 'condition'
        ];

        // Filter out any keys not in the valid columns list
        const filteredData = {};
        for (const key of Object.keys(updateData)) {
            if (validColumns.includes(key) && updateData[key] !== undefined) {
                filteredData[key] = updateData[key];
            }
        }

        // Build update query dynamically
        const fields = Object.keys(filteredData);
        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }
        const setClause = fields.map(field => {
            // Handle reserved words like condition with backticks
            if (field === 'condition') {
                return '`condition` = ?';
            }
            return `${field} = ?`;
        }).join(', ');
        const values = [...Object.values(filteredData), req.params.id];

        const sql = `UPDATE products SET ${setClause} WHERE id = ?`;
        await query(sql, values);

        const product = await findById('products', req.params.id);

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
    try {
        // Soft delete - set is_active to false
        await query('UPDATE products SET is_active = FALSE WHERE id = ?', [req.params.id]);

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update product stock (Admin)
// @route   PUT /api/products/:id/stock
// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private/Admin
exports.updateStock = async (req, res, next) => {
    try {
        const { stock } = req.body;
        const numStock = Math.max(0, parseInt(stock, 10) || 0);
        const productId = String(req.params.id).trim();

        await query('UPDATE products SET stock = ?, current_stock = ? WHERE id = ?', [numStock, numStock, productId]);

        const product = await findById('products', productId);

        res.status(200).json({
            success: true,
            message: 'Stock updated successfully',
            product
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk update stock for multiple products (Admin)
// @route   POST /api/products/bulk-stock
// @access  Private/Admin
exports.bulkUpdateStock = async (req, res, next) => {
    try {
        const { product_ids, action = 'add', amount = 0 } = req.body;

        if (!Array.isArray(product_ids) || product_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of product IDs'
            });
        }

        const numAmount = Math.max(0, parseInt(amount, 10) || 0);

        // Ensure all IDs are strings (UUIDs)
        const cleanIds = product_ids.map(id => String(id).trim()).filter(id => id.length > 0);
        if (cleanIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid product IDs provided'
            });
        }

        const placeholders = cleanIds.map(() => '?').join(',');
        
        let sql;
        let params;

        if (action === 'add') {
            sql = `UPDATE products SET stock = COALESCE(stock, 0) + ?, current_stock = COALESCE(current_stock, 0) + ? WHERE id IN (${placeholders})`;
            params = [numAmount, numAmount, ...cleanIds];
        } else if (action === 'set') {
            sql = `UPDATE products SET stock = ?, current_stock = ? WHERE id IN (${placeholders})`;
            params = [numAmount, numAmount, ...cleanIds];
        } else if (action === 'subtract') {
            sql = `UPDATE products SET stock = GREATEST(0, COALESCE(stock, 0) - ?), current_stock = GREATEST(0, COALESCE(current_stock, 0) - ?) WHERE id IN (${placeholders})`;
            params = [numAmount, numAmount, ...cleanIds];
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Supported actions: add, set, subtract'
            });
        }

        const result = await query(sql, params);

        res.status(200).json({
            success: true,
            message: `Successfully updated stock for ${cleanIds.length} products`,
            updatedCount: result.affectedRows || cleanIds.length,
            action,
            amount: numAmount
        });
    } catch (error) {
        next(error);
    }
};

