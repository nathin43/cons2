const express = require('express');
const router = express.Router();
const { getInvoicesByUserId } = require('../controllers/reportControllerNew');
const { adminProtect } = require('../middleware/auth');

/**
 * Invoice Routes (For Admin Reports)
 */

// Admin route to get invoices by user ID
router.get('/user/:userId', adminProtect, getInvoicesByUserId);

module.exports = router;
