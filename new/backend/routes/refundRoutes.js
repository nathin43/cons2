const express = require('express');
const router = express.Router();
const {
  createRefund,
  getAllRefunds,
  getRefundById,
  updateRefundStatus,
  replyToRefund,
  getMyRefunds,
  getRefundStats,
} = require('../controllers/refundController');
const { protect, adminProtect } = require('../middleware/auth');

/**
 * Refund Routes
 */

// Admin routes
router.get('/stats', adminProtect, getRefundStats);
router.get('/', adminProtect, getAllRefunds);
router.get('/:id', adminProtect, getRefundById);
router.put('/:id', adminProtect, updateRefundStatus);
router.post('/:id/reply', adminProtect, replyToRefund);

// Customer routes
router.post('/', protect, createRefund);
router.get('/my/list', protect, getMyRefunds);

module.exports = router;
