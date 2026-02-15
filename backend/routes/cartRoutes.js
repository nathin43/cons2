const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const { checkUserStatus } = require('../middleware/checkUserStatus');

/**
 * Cart Routes - User-Based Persistent Cart System
 * 
 * All cart operations require authentication.
 * Cart data is stored in MongoDB linked to user ID and persists across sessions:
 * - On login: Cart is restored from database
 * - On logout: Cart remains in database (not cleared)
 * - On order placement: Cart is cleared after successful order
 * - Guest users: Cannot save cart persistently
 * 
 * This ensures professional e-commerce behavior with session persistence
 */

// Protected routes - all require authentication
router.get('/', protect, getCart);
router.post('/add', protect, checkUserStatus, addToCart);
router.put('/update', protect, checkUserStatus, updateCartItem);
router.delete('/remove/:productId', protect, removeFromCart);
router.delete('/clear', protect, clearCart);

module.exports = router;
