const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updatePassword,
  getUserById,
  verifyProfileUpdate,
  getUserDataForModules
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

// Customer routes — MUST come before /:userId wildcard to avoid shadowing
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/profile/verify', protect, verifyProfileUpdate);
router.put('/password', protect, updatePassword);

// Admin route to get user by ID (wildcard — must come AFTER all literal routes)
router.get('/:userId', adminProtect, getUserById);

// Get user data for related modules (used by Cart, Orders, Reports, etc)
router.get('/:userId/data', protect, getUserDataForModules);

module.exports = router;
