const express = require('express');
const router = express.Router();
const { register, login, adminLogin, getMe, logout, adminLogout, forgotPassword } = require('../controllers/authController');
const { googleAuth } = require('../controllers/googleAuthController');
const { protect, adminProtect } = require('../middleware/auth');

/**
 * Authentication Routes
 * Handles customer and admin login/registration/logout
 */

// Common routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// Admin routes
router.post('/admin/login', adminLogin);
router.post('/admin/logout', adminProtect, adminLogout);

module.exports = router;
