const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getRevenueTrend,
  getCustomers,
  getCustomer,
  getUserByEmail,
  deleteCustomer,
  getTopBuyers,
  checkDataConsistency,
  verifyUserProfile,
  getUserAuditLog
} = require('../controllers/adminController');
const { updateCategory } = require('../controllers/categoryController');
const { adminProtect } = require('../middleware/auth');

/**
 * Admin Routes
 * All routes require admin authentication
 */

router.use(adminProtect); // Apply admin authentication to all routes

router.get('/dashboard', getDashboard);
router.get('/revenue-trend', getRevenueTrend);
router.get('/customers', getCustomers);
router.get('/customers/top-buyers', getTopBuyers);
router.get('/user/:email', getUserByEmail); // Get user by email for return request reply
router.get('/customers/:id', getCustomer);
router.delete('/customers/:id', deleteCustomer);

// Verification and consistency check routes
router.get('/verify/data-consistency', checkDataConsistency);
router.get('/verify/profile/:userId', verifyUserProfile);
router.get('/verify/audit/:userId', getUserAuditLog);

// Category GST & shipping management — admin-authenticated via router.use(adminProtect) above
router.put('/categories/update/:id', updateCategory);

module.exports = router;
