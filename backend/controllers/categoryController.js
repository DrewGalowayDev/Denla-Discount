const { query, queryOne, generateUUID } = require('../config/database');
const { findById } = require('../utils/dbHelpers');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res, next) => {
    try {
        const sql = `
            SELECT c.*, 
                (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = TRUE) as products_count
            FROM categories c
            WHERE c.is_active = TRUE
            ORDER BY c.sort_order ASC, c.name ASC
        `;
        
        const categories = await query(sql);

        res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
exports.getCategoryById = async (req, res, next) => {
    try {
        const sql = `
            SELECT c.*, 
                (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = TRUE) as products_count
            FROM categories c
            WHERE c.id = ? AND c.is_active = TRUE
        `;
        
        const category = await queryOne(sql, [req.params.id]);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            category
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create category (Admin)
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res, next) => {
    try {
        const { name, slug, description, icon, color, image, parent_id, sort_order } = req.body;
        const categoryId = generateUUID();

        const sql = `
            INSERT INTO categories (id, name, slug, description, icon, color, image, parent_id, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await query(sql, [
            categoryId, name, slug, description || null, icon || null,
            color || null, image || null, parent_id || null, sort_order || 0
        ]);

        const category = await findById('categories', categoryId);

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            category
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update category (Admin)
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res, next) => {
    try {
        const updateData = req.body;

        // Build update query dynamically
        const fields = Object.keys(updateData);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = [...Object.values(updateData), req.params.id];

        const sql = `UPDATE categories SET ${setClause} WHERE id = ?`;
        await query(sql, values);

        const category = await findById('categories', req.params.id);

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            category
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete category (Admin)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res, next) => {
    try {
        // Soft delete
        await query('UPDATE categories SET is_active = FALSE WHERE id = ?', [req.params.id]);

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
