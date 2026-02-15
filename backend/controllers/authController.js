const User = require('../models/User');
const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');

/**
 * Customer Register
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate input
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone
    });

    // Save user (password will be hashed by pre-save middleware)
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

/**
 * Customer Login
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check account status
    const actualStatus = user.getActualStatus();
    
    // BLOCKED users cannot login
    if (actualStatus.status === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked',
        reason: actualStatus.reason,
        blockedAt: actualStatus.changedAt,
        blockedBy: actualStatus.changedBy
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment failed login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      // Auto-suspend after 5 failed attempts
      if (user.loginAttempts >= 5 && user.status !== 'SUSPENDED') {
        user.status = 'SUSPENDED';
        user.statusReason = 'Too many failed login attempts';
        user.statusChangedAt = new Date();
        user.statusChangedBy = 'system';
        user.suspensionUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      }
      
      await user.save();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        remainingAttempts: user.loginAttempts < 5 ? 5 - user.loginAttempts : 0
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lastLoginAt = new Date();
    
    // Auto-activate if suspension expired
    if (user.status === 'SUSPENDED' && actualStatus.status === 'ACTIVE') {
      user.status = 'ACTIVE';
      user.statusReason = null;
      user.statusChangedAt = new Date();
      user.statusChangedBy = 'system';
      user.suspensionUntil = null;
    }
    
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    const response = {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        status: actualStatus.status
      }
    };

    // Add warnings for SUSPENDED or INACTIVE users
    if (actualStatus.status === 'SUSPENDED') {
      response.warning = {
        message: 'Your account is suspended',
        reason: actualStatus.reason,
        suspensionUntil: actualStatus.suspensionUntil
      };
    } else if (actualStatus.status === 'INACTIVE') {
      response.message = 'Welcome back! We missed you';
      response.info = {
        message: 'Your account was inactive',
        lastLogin: user.lastLoginAt
      };
    }

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Admin Login
 * @route POST /api/auth/admin/login
 * @access Public
 */
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Admin login attempt:', { email, hasPassword: !!password });

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for admin
    const admin = await Admin.findOne({ email }).select('+password');
    console.log('Admin found:', admin ? 'Yes' : 'No');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Set role based on email - manielectricals@gmail.com is MAIN_ADMIN
    let adminRole = admin.email === 'manielectricals@gmail.com' ? 'MAIN_ADMIN' : 'SUB_ADMIN';
    console.log('Admin role:', adminRole);

    // Update role in database if needed
    if (admin.role !== adminRole) {
      admin.role = adminRole;
      await admin.save();
    }

    // Generate token with role included for validation on protected routes
    const token = generateToken(admin._id, adminRole);

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: adminRole,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get Current User Profile
 * @route GET /api/auth/me
 * @access Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Customer Logout
 * @route POST /api/auth/logout
 * @access Private
 */
exports.logout = async (req, res) => {
  try {
    // Just clear the session/token on backend
    // Cart data is preserved in database for when user logs back in

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Admin Logout - Clear admin session
 * @route POST /api/auth/admin/logout
 * @access Private
 */
exports.adminLogout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Admin logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Forgot Password - Reset password without email verification
 * @route POST /api/auth/forgot-password
 * @access Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Validate password length
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email not registered'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Password reset failed'
    });
  }
};
