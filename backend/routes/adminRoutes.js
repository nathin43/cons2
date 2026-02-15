const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getCustomers,
  getCustomer,
  deleteCustomer
} = require('../controllers/adminController');
const { adminProtect } = require('../middleware/auth');

/**
 * Admin Routes
 * All routes require admin authentication
 */

router.use(adminProtect); // Apply admin authentication to all routes

router.get('/dashboard', getDashboard);
router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomer);
router.delete('/customers/:id', deleteCustomer);

module.exports = router;
