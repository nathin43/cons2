const express = require('express');
const router = express.Router();
const {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin
} = require('../controllers/adminManagementController');
const { adminProtect, mainAdminOnly } = require('../middleware/auth');

/**
 * Admin Management Routes
 * 
 * SECURITY & AUTHORIZATION:
 * ================================
 * 1. All routes REQUIRE valid JWT token (adminProtect middleware)
 * 2. All routes REQUIRE MAIN_ADMIN role (mainAdminOnly middleware)
 * 3. If admin is SUB_ADMIN: Returns 403 Forbidden
 * 4. If token is invalid/missing: Returns 401 Unauthorized
 * 
 * ROLE-BASED BEHAVIOR:
 * ================================
 * MAIN_ADMIN (manielectricals@gmail.com):
 *   - Can view all admins
 *   - Can add new admins
 *   - Can edit admin details
 *   - Can delete admins
 * 
 * SUB_ADMIN (all others):
 *   - Cannot access ANY admin-management routes
 *   - Receives 403 Forbidden on all requests
 * 
 * MAIN_ADMIN PROTECTION:
 * ================================
 * - Only manielectricals@gmail.com can have MAIN_ADMIN role
 * - Role is auto-assigned based on email (cannot be manually changed)
 * - MAIN_ADMIN account cannot be deleted
 * - MAIN_ADMIN account cannot have email changed
 */

// Apply admin authentication to all routes
router.use(adminProtect);

// Apply MAIN_ADMIN check to all routes in this router
// Returns 403 Forbidden if admin role is not MAIN_ADMIN
router.use(mainAdminOnly);

/**
 * GET /api/admin-management/admins
 * Fetch all admin accounts
 */
router.get('/admins', getAllAdmins);

/**
 * GET /api/admin-management/admins/:id
 * Fetch specific admin by ID
 */
router.get('/admins/:id', getAdminById);

/**
 * POST /api/admin-management/admins
 * Create new admin account
 * Role auto-assigned: SUB_ADMIN (unless email is manielectricals@gmail.com)
 */
router.post('/admins', createAdmin);

/**
 * PUT /api/admin-management/admins/:id
 * Update admin details (name, email, status)
 * Cannot change MAIN_ADMIN email
 */
router.put('/admins/:id', updateAdmin);

/**
 * DELETE /api/admin-management/admins/:id
 * Delete admin account
 * Cannot delete MAIN_ADMIN (manielectricals@gmail.com)
 */
router.delete('/admins/:id', deleteAdmin);

module.exports = router;
