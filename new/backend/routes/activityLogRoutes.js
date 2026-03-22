const express = require('express');
const router = express.Router();
const {
  getActivityLogs,
  getActivityLogById,
  getActivityStats,
  cleanupLogs,
} = require('../controllers/activityLogController');
const { adminProtect, mainAdminOnly } = require('../middleware/auth');

/**
 * Activity Log Routes (Admin only)
 */

router.get('/stats', adminProtect, getActivityStats);
router.get('/', adminProtect, getActivityLogs);
router.get('/:id', adminProtect, getActivityLogById);
router.delete('/cleanup', mainAdminOnly, cleanupLogs);

module.exports = router;
