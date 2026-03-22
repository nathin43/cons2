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
  toggleProductStatus,
  getSpecificationSchemas,
  getCategorySpecificationSchema
} = require('../controllers/productController');
const { adminProtect } = require('../middleware/auth');
const { uploadProductImages } = require('../middleware/upload');

/**
 * Product Routes
 * Public routes for viewing products
 * Admin routes for managing products
 */

// Public routes - SPECIFIC routes must come BEFORE /:id catch-all
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/specifications/schemas', getSpecificationSchemas);
router.get('/specifications/schemas/:category', getCategorySpecificationSchema);

// Admin routes - BEFORE /:id to ensure POST works correctly
router.post('/', adminProtect, uploadProductImages, createProduct);
router.put('/:id', adminProtect, uploadProductImages, updateProduct);
router.patch('/:id/status', adminProtect, toggleProductStatus);
router.delete('/:id', adminProtect, deleteProduct);

// Must be last - catch-all by ID
router.get('/:id', getProduct);

module.exports = router;
