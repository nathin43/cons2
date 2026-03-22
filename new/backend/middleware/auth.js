const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

/**
 * Protect routes - Verify JWT token for customer authentication
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      // This usually means an admin token was sent to a customer route,
      // or the user account was deleted while the token was still valid.
      console.error(
        `[auth] protect: no User found for decoded.id=${decoded.id}. ` +
        `Possible cause: admin token sent to customer route, or user was deleted.`
      );
      return res.status(401).json({
        success: false,
        message: 'Session invalid. Please log out and log in again as a customer.'
      });
    }

    // Add id property for convenience
    req.user.id = req.user._id.toString();

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

/**
 * Admin authentication middleware
 * Verifies JWT token for admin users
 */
exports.adminProtect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access admin panel'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get admin from token
    req.admin = await Admin.findById(decoded.id).select('-password');

    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Use role from database; fall back to JWT claim only if DB field is somehow missing
    req.admin.role = req.admin.role || decoded.role || 'SUB_ADMIN';

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access admin panel'
    });
  }
};

/**
 * Role-based authorization middleware
 * Only allows MAIN_ADMIN to access admin management features
 * SUB_ADMIN receives 403 Forbidden
 */
exports.mainAdminOnly = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  // Check if admin is MAIN_ADMIN by role
  if (req.admin.role !== 'MAIN_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin management is restricted.'
    });
  }

  next();
};

/**
 * Check admin status middleware
 * Ensures admin is Active
 */
exports.checkAdminStatus = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  if (req.admin.status === 'Disabled') {
    return res.status(403).json({
      success: false,
      message: 'Your admin account has been disabled'
    });
  }

  next();
};

/**
 * Optional authentication middleware
 * Attaches user to req.user if token exists, but doesn't reject if missing
 * Useful for routes that work for both authenticated and guest users
 */
exports.optionalAuth = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token, continue without user
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (req.user) {
      // Add id property for convenience
      req.user.id = req.user._id.toString();
    }
  } catch (error) {
    // Token invalid, but we continue without user
    req.user = null;
  }

  next();
};
