const express = require('express');
const router = express.Router();
const {
  getCategories,
  updateCategory
} = require('../controllers/categoryController');
const { adminProtect } = require('../middleware/auth');

/**
 * Category Routes
 * GET  /api/categories         — public: fetch all category pricing
 * PUT  /api/categories/:id     — admin:  update GST / shipping
 */

router.get('/', getCategories);
router.put('/:id', adminProtect, updateCategory);

module.exports = router;
