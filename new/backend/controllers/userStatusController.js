const User = require('../models/User');

/**
 * Block a user account
 * @route PUT /api/admin/users/:userId/block
 * @access Private/Admin
 */
exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for blocking'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.status = 'BLOCKED';
    user.statusReason = reason;
    user.statusChangedAt = new Date();
    user.statusChangedBy = req.user.email;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User blocked successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        statusReason: user.statusReason,
        statusChangedAt: user.statusChangedAt,
        statusChangedBy: user.statusChangedBy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Unblock a user account
 * @route PUT /api/admin/users/:userId/unblock
 * @access Private/Admin
 */
exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.status = 'ACTIVE';
    user.statusReason = null;
    user.statusChangedAt = new Date();
    user.statusChangedBy = req.user.email;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        statusChangedAt: user.statusChangedAt,
        statusChangedBy: user.statusChangedBy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Suspend a user account
 * @route PUT /api/admin/users/:userId/suspend
 * @access Private/Admin
 */
exports.suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, days = 7 } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for suspension'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const suspensionUntil = new Date();
    suspensionUntil.setDate(suspensionUntil.getDate() + parseInt(days));

    user.status = 'SUSPENDED';
    user.statusReason = reason;
    user.statusChangedAt = new Date();
    user.statusChangedBy = req.user.email;
    user.suspensionUntil = suspensionUntil;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User suspended successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        statusReason: user.statusReason,
        statusChangedAt: user.statusChangedAt,
        statusChangedBy: user.statusChangedBy,
        suspensionUntil: user.suspensionUntil
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Activate a user account (remove suspension)
 * @route PUT /api/admin/users/:userId/activate
 * @access Private/Admin
 */
exports.activateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.status = 'ACTIVE';
    user.statusReason = null;
    user.statusChangedAt = new Date();
    user.statusChangedBy = req.user.email;
    user.suspensionUntil = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User activated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        statusChangedAt: user.statusChangedAt,
        statusChangedBy: user.statusChangedBy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get user status history and details
 * @route GET /api/admin/users/:userId/status
 * @access Private/Admin
 */
exports.getUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const actualStatus = user.getActualStatus();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        databaseStatus: user.status,
        actualStatus: actualStatus.status,
        statusReason: actualStatus.reason,
        statusChangedAt: actualStatus.changedAt,
        statusChangedBy: actualStatus.changedBy,
        suspensionUntil: actualStatus.suspensionUntil,
        lastLoginAt: user.lastLoginAt,
        loginAttempts: user.loginAttempts,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
