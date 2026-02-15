const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  getFeaturedProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus
} = require('../controllers/productController');
const { adminProtect } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * Product Routes
 * Public routes for viewing products
 * Admin routes for managing products
 */

// Public routes - SPECIFIC routes must come BEFORE /:id catch-all
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);

// Admin routes - BEFORE /:id to ensure POST works correctly
router.post('/', adminProtect, upload.single('image'), createProduct);
router.put('/:id', adminProtect, upload.single('image'), updateProduct);
router.patch('/:id/status', adminProtect, toggleProductStatus);
router.delete('/:id', adminProtect, deleteProduct);

// Must be last - catch-all by ID
router.get('/:id', getProduct);

module.exports = router;
