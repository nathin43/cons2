const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updatePassword,
  getUserById
} = require('../controllers/userController');
const {
  blockUser,
  unblockUser,
  suspendUser,
  activateUser,
  getUserStatus
} = require('../controllers/userStatusController');
const { protect, adminProtect } = require('../middleware/auth');

/**
 * User Routes
 * Customer routes require protect, admin routes require adminProtect
 */

// Admin routes for user status management
router.put('/:userId/block', adminProtect, blockUser);
router.put('/:userId/unblock', adminProtect, unblockUser);
router.put('/:userId/suspend', adminProtect, suspendUser);
router.put('/:userId/activate', adminProtect, activateUser);
router.get('/:userId/status', adminProtect, getUserStatus);

// Admin route to get user by ID (must come first, before protect middleware)
router.get('/:userId', adminProtect, getUserById);

// Customer routes (require authentication)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);

module.exports = router;
