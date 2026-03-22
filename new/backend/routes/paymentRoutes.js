const express = require('express');
const router = express.Router();
const {
  getAllPayments,
  getPaymentById,
  getPaymentsByUserId,
  getMyPayments,
  getPaymentStats,
} = require('../controllers/paymentController');
const { protect, adminProtect } = require('../middleware/auth');

/**
 * Payment Routes
 */

// Admin routes
router.get('/stats', adminProtect, getPaymentStats);
router.get('/', adminProtect, getAllPayments);
router.get('/user/:userId', adminProtect, getPaymentsByUserId);
router.get('/:id', adminProtect, getPaymentById);

// Customer routes
router.get('/my/list', protect, getMyPayments);

module.exports = router;
