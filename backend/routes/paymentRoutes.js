const express = require('express');
const router = express.Router();
const { getPaymentsByUserId } = require('../controllers/reportControllerNew');
const { adminProtect } = require('../middleware/auth');

/**
 * Payment Routes (For Admin Reports)
 */

// Admin route to get payments by user ID
router.get('/user/:userId', adminProtect, getPaymentsByUserId);

module.exports = router;
