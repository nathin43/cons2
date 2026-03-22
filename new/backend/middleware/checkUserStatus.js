/**
 * Middleware to check user account status before allowing actions
 */

const checkUserStatus = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  const actualStatus = req.user.getActualStatus();

  // BLOCKED users cannot perform any action
  if (actualStatus.status === 'BLOCKED') {
    return res.status(403).json({
      success: false,
      message: 'Your account has been blocked',
      reason: actualStatus.reason,
      blockedAt: actualStatus.changedAt,
      blockedBy: actualStatus.changedBy
    });
  }

  // Update user with actual status if it changed (e.g., suspension expired)
  if (req.user.status === 'SUSPENDED' && actualStatus.status === 'ACTIVE') {
    req.user.status = 'ACTIVE';
    req.user.statusReason = null;
    req.user.statusChangedAt = new Date();
    req.user.statusChangedBy = 'system';
    req.user.suspensionUntil = null;
    req.user.save().catch(err => console.error('Failed to update status:', err));
  }

  // Attach actual status to request
  req.actualUserStatus = actualStatus;
  next();
};

const checkCanPlaceOrder = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Please login to place orders'
    });
  }

  const actualStatus = req.user.getActualStatus();

  // BLOCKED users cannot place orders
  if (actualStatus.status === 'BLOCKED') {
    return res.status(403).json({
      success: false,
      message: 'Your account has been blocked. You cannot place orders.',
      reason: actualStatus.reason
    });
  }

  // SUSPENDED users cannot place orders
  if (actualStatus.status === 'SUSPENDED') {
    return res.status(403).json({
      success: false,
      message: 'Your account is suspended. You cannot place orders.',
      reason: actualStatus.reason,
      suspensionUntil: actualStatus.suspensionUntil
    });
  }

  next();
};

const checkCanLogin = (req, res, next) => {
  // This is called after user is found but before login is allowed
  if (!req.user) {
    return next();
  }

  const actualStatus = req.user.getActualStatus();

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

  // SUSPENDED users can login but with warning
  if (actualStatus.status === 'SUSPENDED') {
    req.suspensionWarning = {
      message: 'Your account is suspended',
      reason: actualStatus.reason,
      suspensionUntil: actualStatus.suspensionUntil
    };
  }

  // INACTIVE users can login but with re-engagement message
  if (actualStatus.status === 'INACTIVE') {
    req.inactiveWarning = {
      message: 'Welcome back! We missed you',
      lastLogin: actualStatus.changedAt
    };
  }

  next();
};

module.exports = {
  checkUserStatus,
  checkCanPlaceOrder,
  checkCanLogin
};
