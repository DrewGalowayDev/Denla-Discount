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
                   p.selling_price as price,
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
                   p.selling_price as price,
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
                   p.selling_price as price,
                   c.name as category_name, 
                   c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = TRUE
        `;
        
        const params = [];

        if (minPrice) {
            sql += ' AND p.price >= ?';
            params.push(parseFloat(minPrice));
        }
        if (maxPrice) {
            sql += ' AND p.price <= ?';
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
            sql += ' AND p.stock > 0';
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
                   p.selling_price as price,
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
                   p.selling_price as price,
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
                   p.selling_price as price,
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
                   p.selling_price as price,
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
                   p.selling_price as price,
                   p.cost_price as old_price,
                   c.name as category_name, 
                   c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.cost_price IS NOT NULL AND p.is_active = TRUE
            ORDER BY (p.cost_price - p.selling_price) DESC
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
                   p.selling_price as price,
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

        const sql = `
            INSERT INTO products (
                id, name, slug, description, specifications, price, old_price, brand, \`condition\`,
                stock, low_stock_threshold, sku, images, category_id, is_featured, is_deal,
                is_new_arrival, meta_title, meta_description, meta_keywords
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await query(sql, [
            productId, name, slug, description,
            specifications ? JSON.stringify(specifications) : null,
            price, old_price || null, brand, condition || 'new',
            stock || 0, low_stock_threshold || 10, sku || null,
            images ? JSON.stringify(images) : null,
            category_id, is_featured || false, is_deal || false,
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
        const updateData = req.body;
        
        // Convert specifications and images to JSON strings if they exist
        if (updateData.specifications) {
            updateData.specifications = JSON.stringify(updateData.specifications);
        }
        if (updateData.images) {
            updateData.images = JSON.stringify(updateData.images);
        }

        // Build update query dynamically
        const fields = Object.keys(updateData);
        const setClause = fields.map(field => {
            // Handle the condition field with backticks
            if (field === 'condition') {
                return '`condition` = ?';
            }
            return `${field} = ?`;
        }).join(', ');
        const values = [...Object.values(updateData), req.params.id];

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
// @access  Private/Admin
exports.updateStock = async (req, res, next) => {
    try {
        const { stock } = req.body;

        await query('UPDATE products SET stock = ? WHERE id = ?', [stock, req.params.id]);

        const product = await findById('products', req.params.id);

        res.status(200).json({
            success: true,
            message: 'Stock updated successfully',
            product
        });
    } catch (error) {
        next(error);
    }
};
