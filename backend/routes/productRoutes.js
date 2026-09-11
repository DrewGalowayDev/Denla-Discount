const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const productController = require('../controllers/productController');

// Public routes — specific named routes MUST come before /:id
router.get('/', productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/filter', productController.filterProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/deals', productController.getDealsProducts);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/brand/:brand', productController.getProductsByBrand);

// Generic ID route — must be LAST among GET routes
router.get('/:id', productController.getProductById);

// Protected routes (Admin only)
router.post('/', protect, authorize('admin'), productController.createProduct);
router.put('/:id', protect, authorize('admin'), productController.updateProduct);
router.delete('/:id', protect, authorize('admin'), productController.deleteProduct);
router.put('/:id/stock', protect, authorize('admin'), productController.updateStock);

module.exports = router;
