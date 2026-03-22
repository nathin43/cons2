const express = require('express');
const router = express.Router();
const {
  getMyReports,
  getMyOrders,
  downloadMyReport,
  generateMyReport
} = require('../controllers/userReportController');
const { protect } = require('../middleware/auth');

/**
 * User Report Routes
 * All routes require user authentication
 * Users can ONLY access their OWN data
 * 
 * Base path: /api/user/reports
 */

// Get logged-in user's own reports
router.get('/', protect, getMyReports);

// Get logged-in user's orders for reporting
router.get('/orders', protect, getMyOrders);

// Download user's own report
router.get('/download/:reportId', protect, downloadMyReport);

// Generate report for user's own order
router.post('/generate/:orderId', protect, generateMyReport);

module.exports = router;
