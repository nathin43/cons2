const express = require('express');
const router = express.Router();
const {
  createReport,
  getAllReports,
  getUserReports,
  getReportById,
  downloadReport,
  generateReportForOrder,
  getReportStats,
  getCustomerReports,
  getCustomerReportById,
  downloadCustomerReport,
  deleteCustomerReports,
  regenerateCustomerReport,
  getUserFullReport
} = require('../controllers/reportController');
const { getUsersForReports, exportUsersExcel } = require('../controllers/reportControllerNew');
const { protect, adminProtect } = require('../middleware/auth');

/**
 * Report Routes
 * 
 * ADMIN ROUTES (All admin users):
 * - GET /api/reports - View all reports
 * - GET /api/reports/stats/dashboard - Get report statistics
 * 
 * USER ROUTES (Authenticated users):
 * - GET /api/reports/user/:userId - View own reports (access control in controller)
 * - POST /api/reports/generate/:orderId - Generate report for their order
 * - PUT /api/reports/:reportId/download - Download their report
 * - GET /api/reports/:reportId - View report details (access control in controller)
 * 
 * INTERNAL ROUTES (Called from other endpoints):
 * - POST /api/reports/create - Auto-create report (called after order/payment)
 */

// Internal route - Create report (called automatically)
// This should be called from order and payment controllers
router.post('/create', createReport);

// Admin routes - all protected with adminProtect
router.get('/stats/dashboard', adminProtect, getReportStats);
router.get('/users', adminProtect, getUsersForReports);
router.get('/export/excel', adminProtect, exportUsersExcel);
router.get('/', adminProtect, getAllReports);
router.get('/customers', adminProtect, getCustomerReports);
router.get('/customers/:customerId', adminProtect, getCustomerReportById);
router.put('/customers/:customerId/download', adminProtect, downloadCustomerReport);
router.delete('/customers/:customerId', adminProtect, deleteCustomerReports);
router.post('/customers/:customerId/regenerate', adminProtect, regenerateCustomerReport);

// ADMIN ONLY: Get comprehensive user report (all data in one call)
router.get('/admin/user/:userId', adminProtect, getUserFullReport);

// User and Admin routes - protect with user JWT auth
// Access control is handled inside each controller
router.use(protect); // Protect all routes below with JWT auth

// Get user's own reports (users) or all reports for admin
router.get('/user/:userId', getUserReports);

// User can generate report for their order
router.post('/generate/:orderId', generateReportForOrder);

// View report details (with access control in controller)
router.get('/:reportId', getReportById);

// Download report
router.put('/:reportId/download', downloadReport);

module.exports = router;
