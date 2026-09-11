const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Create a new sale (POS checkout)
router.post('/', salesController.createSale);

// Get all sales with filters
router.get('/', salesController.getSales);

// Get sales report/summary
router.get('/report', salesController.getSalesReport);

// Get single sale by ID
router.get('/:id', salesController.getSaleById);

// Void/Cancel a sale (admin/manager only)
router.put('/:id/void', authorize('admin', 'manager'), salesController.voidSale);

module.exports = router;
