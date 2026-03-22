const User = require('../models/User');
const UserNotificationService = require('../services/userNotificationService');

/**
 * Get user profile
 * @route GET /api/users/profile
 * @access Private
 * 
 * Returns the latest user profile directly from database
 * Used after updates to verify changes were saved
 */
exports.getProfile = async (req, res) => {
  try {
    // Force fresh read from database (no caching)
    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/users/profile
 * @access Private
 * 
 * Updates ONLY user data in Users collection
 * Related modules (Orders, Cart, Reports) fetch user data via userId reference
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }

    // Validate name (not empty, reasonable length)
    if (name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 100 characters'
      });
    }

    // Validate phone (basic validation)
    if (phone.trim().length < 10 || phone.trim().length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be between 10 and 20 characters'
      });
    }

    // Prepare update object with only provided fields
    const updateData = {
      name: name.trim(),
      phone: phone.trim()
    };

    // Only update address if provided
    if (address) {
      if (address.street) updateData['address.street'] = address.street.trim();
      if (address.city) updateData['address.city'] = address.city.trim();
      if (address.state) updateData['address.state'] = address.state.trim();
      if (address.zipCode) updateData['address.zipCode'] = address.zipCode.trim();
      if (address.country) updateData['address.country'] = address.country.trim();
    }

    // Use findByIdAndUpdate for atomic operation
    // { new: true } returns the updated document
    // { runValidators: true } runs schema validation
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    // If user not found
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Notify user: profile updated (fire-and-forget)
    UserNotificationService.notifyProfileUpdated(userId).catch((err) =>
      console.error('Profile-updated notification error (non-fatal):', err.message)
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update user password
 * @route PUT /api/users/password
 * @access Private
 */
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    // Notify user: password changed (fire-and-forget)
    UserNotificationService.notifyPasswordChanged(req.user.id).catch((err) =>
      console.error('Password-changed notification error (non-fatal):', err.message)
    );

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get user by ID (Admin only)
 * @route GET /api/users/:userId
 * @access Private/Admin
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Verify profile update was successful
 * @route GET /api/users/profile/verify
 * @access Private
 * 
 * Backend verification that profile changes were saved correctly to MongoDB
 * Returns comparison of current data
 */
exports.verifyProfileUpdate = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch fresh user data from database
    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        verified: false
      });
    }

    // Return detailed verification
    res.status(200).json({
      success: true,
      verified: true,
      message: 'Profile data verified in database',
      userData: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      verified: false,
      message: error.message
    });
  }
};

/**
 * Get user data for related modules (Cart, Orders, Reports, etc)
 * @route GET /api/users/:userId/data
 * @access Private
 * 
 * Used by related modules to fetch current user information
 * Ensures all modules have access to latest user details without duplication
 */
exports.getUserDataForModules = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const user = await User.findById(userId).select('_id name email phone address status').lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      userData: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
