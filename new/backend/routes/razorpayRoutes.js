const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyAndSaveOrder } = require('../controllers/razorpayController');
const { protect } = require('../middleware/auth');
const { checkCanPlaceOrder } = require('../middleware/checkUserStatus');

/**
 * Razorpay Payment Routes
 */

// Step 1: Create a Razorpay order (validates stock, returns razorpay order id)
router.post('/create-order', protect, checkCanPlaceOrder, createRazorpayOrder);

// Step 2: Verify signature & persist order in DB as Paid
router.post('/verify-payment', protect, verifyAndSaveOrder);

module.exports = router;
