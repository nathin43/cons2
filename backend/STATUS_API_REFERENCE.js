/**
 * ACCOUNT STATUS API ENDPOINTS
 * Mani Electrical - Admin System
 */

// =============================================================================
// ADMIN ENDPOINTS - User Status Management
// =============================================================================

/**
 * 1. BLOCK USER
 * PUT /api/users/:userId/block
 * Access: Admin only
 * 
 * Request Body:
 * {
 *   "reason": "Policy violation - fake orders"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "User blocked successfully",
 *   "user": {
 *     "id": "...",
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "status": "BLOCKED",
 *     "statusReason": "Policy violation - fake orders",
 *     "statusChangedAt": "2026-02-05T10:30:00.000Z",
 *     "statusChangedBy": "admin@manielectrical.com"
 *   }
 * }
 * 
 * Effects:
 * - User cannot login
 * - User cannot place orders
 * - User cannot add to cart
 */

/**
 * 2. UNBLOCK USER
 * PUT /api/users/:userId/unblock
 * Access: Admin only
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "User unblocked successfully",
 *   "user": {
 *     "status": "ACTIVE",
 *     "statusChangedAt": "2026-02-05T10:35:00.000Z",
 *     "statusChangedBy": "admin@manielectrical.com"
 *   }
 * }
 */

/**
 * 3. SUSPEND USER
 * PUT /api/users/:userId/suspend
 * Access: Admin only
 * 
 * Request Body:
 * {
 *   "reason": "Payment dispute under review",
 *   "days": 7  // Optional, default 7 days
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "User suspended successfully",
 *   "user": {
 *     "status": "SUSPENDED",
 *     "statusReason": "Payment dispute under review",
 *     "suspensionUntil": "2026-02-12T10:30:00.000Z",
 *     "statusChangedAt": "2026-02-05T10:30:00.000Z",
 *     "statusChangedBy": "admin@manielectrical.com"
 *   }
 * }
 * 
 * Effects:
 * - User can login but sees warning
 * - User cannot place orders
 * - Automatically reverts to ACTIVE after suspension expires
 */

/**
 * 4. ACTIVATE USER
 * PUT /api/users/:userId/activate
 * Access: Admin only
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "User activated successfully",
 *   "user": {
 *     "status": "ACTIVE",
 *     "statusChangedAt": "2026-02-05T10:40:00.000Z",
 *     "statusChangedBy": "admin@manielectrical.com"
 *   }
 * }
 */

/**
 * 5. GET USER STATUS
 * GET /api/users/:userId/status
 * Access: Admin only
 * 
 * Response:
 * {
 *   "success": true,
 *   "user": {
 *     "id": "...",
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "databaseStatus": "ACTIVE",
 *     "actualStatus": "INACTIVE",  // Auto-calculated
 *     "statusReason": "No activity for 60+ days",
 *     "statusChangedAt": "2025-12-06T10:30:00.000Z",
 *     "statusChangedBy": "system",
 *     "lastLoginAt": "2025-12-06T10:30:00.000Z",
 *     "loginAttempts": 0,
 *     "createdAt": "2025-10-01T10:00:00.000Z"
 *   }
 * }
 */

// =============================================================================
// USER LOGIN - Automatic Status Checks
// =============================================================================

/**
 * USER LOGIN
 * POST /api/auth/login
 * Access: Public
 * 
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 * 
 * Scenarios:
 * 
 * 1. BLOCKED USER:
 * {
 *   "success": false,
 *   "message": "Your account has been blocked",
 *   "reason": "Policy violation - fake orders",
 *   "blockedAt": "2026-02-05T10:30:00.000Z",
 *   "blockedBy": "admin@manielectrical.com"
 * }
 * 
 * 2. SUSPENDED USER (can login with warning):
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "token": "...",
 *   "user": { ... },
 *   "warning": {
 *     "message": "Your account is suspended",
 *     "reason": "Payment dispute under review",
 *     "suspensionUntil": "2026-02-12T10:30:00.000Z"
 *   }
 * }
 * 
 * 3. INACTIVE USER (welcome back message):
 * {
 *   "success": true,
 *   "message": "Welcome back! We missed you",
 *   "token": "...",
 *   "user": { ... },
 *   "info": {
 *     "message": "Your account was inactive",
 *     "lastLogin": "2025-12-06T10:30:00.000Z"
 *   }
 * }
 * 
 * 4. FAILED LOGIN (5 attempts = auto-suspend):
 * After 5 failed attempts:
 * - User status changed to SUSPENDED
 * - Reason: "Too many failed login attempts"
 * - Duration: 24 hours
 * - Changed by: "system"
 * 
 * Response after 5th failed attempt:
 * {
 *   "success": false,
 *   "message": "Invalid credentials",
 *   "remainingAttempts": 0
 * }
 */

// =============================================================================
// STATUS DETERMINATION LOGIC
// =============================================================================

/**
 * Priority Order (implemented in User.getActualStatus()):
 * 
 * 1. IF status === BLOCKED
 *    → Return BLOCKED (highest priority, manual override)
 * 
 * 2. ELSE IF status === SUSPENDED
 *    → Check if suspension expired
 *      - If expired: Return ACTIVE
 *      - If not expired: Return SUSPENDED
 * 
 * 3. ELSE IF lastLoginAt > 60 days ago
 *    → Return INACTIVE (auto-calculated)
 * 
 * 4. ELSE
 *    → Return ACTIVE (default)
 */

// =============================================================================
// STATUS TYPES & CONDITIONS
// =============================================================================

/**
 * ✅ ACTIVE
 * Conditions:
 * - User successfully registered
 * - Email/mobile verified
 * - Not manually blocked by admin
 * - Last login within 60 days
 * Default: All new users
 * 
 * Effects:
 * - Full access to all features
 * - Can login, browse, add to cart, place orders
 */

/**
 * 🔴 BLOCKED
 * Conditions:
 * - Admin manually blocks user
 * - User violates terms (fake orders, abuse, fraud)
 * 
 * Effects:
 * - Cannot login
 * - Cannot place orders
 * - Cannot add to cart
 * 
 * Metadata:
 * - statusReason (required)
 * - statusChangedAt
 * - statusChangedBy (admin email)
 */

/**
 * 🟠 SUSPENDED
 * Conditions:
 * - Too many failed login attempts (5+)
 * - Payment disputes
 * - Temporary policy review
 * - Admin manual suspension
 * 
 * Effects:
 * - Can login (with warning)
 * - Cannot place orders
 * - Auto-reverts to ACTIVE after suspension period
 * 
 * Metadata:
 * - statusReason (required)
 * - suspensionUntil (expiry date)
 * - statusChangedAt
 * - statusChangedBy
 */

/**
 * 💤 INACTIVE
 * Conditions:
 * - User not logged in for 60+ days
 * - Auto-calculated (not manual)
 * 
 * Effects:
 * - Can login
 * - Shows re-engagement prompts
 * - Welcome back message
 * 
 * Metadata:
 * - lastLoginAt (used to calculate)
 * - Auto-calculated by getActualStatus()
 */

// =============================================================================
// FRONTEND FILTERS
// =============================================================================

/**
 * Admin Reports Page Filter:
 * 
 * GET /api/reports/users?accountStatus=active
 * GET /api/reports/users?accountStatus=blocked
 * GET /api/reports/users?accountStatus=suspended
 * GET /api/reports/users?accountStatus=inactive
 * 
 * Note: INACTIVE filter is calculated on backend using getActualStatus()
 */

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

// Example 1: Block a user for fraud
// PUT /api/users/507f1f77bcf86cd799439011/block
// Body: { "reason": "Multiple fake orders detected" }

// Example 2: Suspend user for 3 days
// PUT /api/users/507f1f77bcf86cd799439011/suspend
// Body: { "reason": "Payment chargeback investigation", "days": 3 }

// Example 3: Unblock a user
// PUT /api/users/507f1f77bcf86cd799439011/unblock

// Example 4: Get user status details
// GET /api/users/507f1f77bcf86cd799439011/status

module.exports = {
  // This file serves as documentation
  // No exports needed
};
