const express = require('express');
const router = express.Router();
const {
  generateDailyReport,
  getSalesReports,
  getSalesReportById,
  deleteSalesReport,
} = require('../controllers/salesReportController');
const { adminProtect } = require('../middleware/auth');

/**
 * Sales Report Routes (Admin only)
 */

router.post('/generate', adminProtect, generateDailyReport);
router.get('/', adminProtect, getSalesReports);
router.get('/:id', adminProtect, getSalesReportById);
router.delete('/:id', adminProtect, deleteSalesReport);

module.exports = router;
