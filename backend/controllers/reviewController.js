const { query, queryOne, generateUUID } = require('../config/database');

// @desc    Get product reviews
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = async (req, res, next) => {
    try {
        const sql = `
            SELECT r.*, u.name as user_name
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.product_id = ?
            ORDER BY r.created_at DESC
        `;

        const reviews = await query(sql, [req.params.productId]);

        res.status(200).json({
            success: true,
            count: reviews.length,
            reviews
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
    try {
        const { product_id, rating, comment } = req.body;

        if (!product_id || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Product ID and rating are required'
            });
        }

        const id = generateUUID();
        await query(
            'INSERT INTO reviews (id, user_id, product_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
            [id, req.user.id, product_id, rating, comment || '']
        );

        // Update product average rating and reviews count
        const ratingStats = await queryOne(
            'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE product_id = ?',
            [product_id]
        );

        const avgRating = ratingStats && ratingStats.avg_rating ? parseFloat(ratingStats.avg_rating).toFixed(1) : rating;
        const reviewCount = ratingStats && ratingStats.review_count ? parseInt(ratingStats.review_count) : 1;

        await query(
            'UPDATE products SET rating = ?, reviews_count = ? WHERE id = ?',
            [avgRating, reviewCount, product_id]
        );

        const review = await queryOne('SELECT * FROM reviews WHERE id = ?', [id]);

        res.status(201).json({
            success: true,
            message: 'Review added',
            review
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res, next) => {
    try {
        const { rating, comment } = req.body;

        await query(
            'UPDATE reviews SET rating = ?, comment = ? WHERE id = ? AND user_id = ?',
            [rating, comment, req.params.id, req.user.id]
        );

        const review = await queryOne('SELECT * FROM reviews WHERE id = ?', [req.params.id]);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Recalculate average rating
        const ratingStats = await queryOne(
            'SELECT AVG(rating) as avg_rating FROM reviews WHERE product_id = ?',
            [review.product_id]
        );
        if (ratingStats && ratingStats.avg_rating) {
            await query(
                'UPDATE products SET rating = ? WHERE id = ?',
                [parseFloat(ratingStats.avg_rating).toFixed(1), review.product_id]
            );
        }

        res.status(200).json({
            success: true,
            message: 'Review updated',
            review
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
    try {
        const review = await queryOne('SELECT product_id FROM reviews WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        await query('DELETE FROM reviews WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

        // Recalculate rating stats
        const ratingStats = await queryOne(
            'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE product_id = ?',
            [review.product_id]
        );
        const avgRating = ratingStats && ratingStats.avg_rating ? parseFloat(ratingStats.avg_rating).toFixed(1) : 0;
        const reviewCount = ratingStats && ratingStats.review_count ? parseInt(ratingStats.review_count) : 0;

        await query(
            'UPDATE products SET rating = ?, reviews_count = ? WHERE id = ?',
            [avgRating, reviewCount, review.product_id]
        );

        res.status(200).json({
            success: true,
            message: 'Review deleted'
        });
    } catch (error) {
        next(error);
    }
};
