const express = require('express');
const router = express.Router();
const {
  createRefund,
  getAllRefunds,
  getRefundById,
  updateRefundStatus,
  getMyRefunds,
  getRefundStats,
  getRefundMessagesAdmin,
  getRefundMessagesUser,
  addRefundMessageAdmin,
  addRefundMessageUser,
} = require('../controllers/refundController');
const { protect, adminProtect } = require('../middleware/auth');

/**
 * Refund Routes
 */

// Admin routes
router.get('/stats', adminProtect, getRefundStats);
router.get('/', adminProtect, getAllRefunds);
router.get('/:id/messages/admin', adminProtect, getRefundMessagesAdmin);
router.post('/:id/messages/admin', adminProtect, addRefundMessageAdmin);
router.get('/:id', adminProtect, getRefundById);
router.put('/:id', adminProtect, updateRefundStatus);

// Customer routes
router.post('/', protect, createRefund);
router.get('/my/list', protect, getMyRefunds);
router.get('/:id/messages', protect, getRefundMessagesUser);
router.post('/:id/messages', protect, addRefundMessageUser);

module.exports = router;
