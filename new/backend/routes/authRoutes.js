const express = require('express');
const router = express.Router();
const { register, login, adminLogin, getMe, adminGetMe, logout, adminLogout, forgotPassword } = require('../controllers/authController');
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
router.post('/logout', logout);
// Admin routes
router.post('/admin/login', adminLogin);
router.get('/admin/me', adminProtect, adminGetMe);
// Admin logout — no auth needed (JWT is stateless; controller just returns success)
router.post('/admin/logout', adminLogout);

module.exports = router;
