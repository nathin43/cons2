/**
 * QUICK REFERENCE: ROLE-BASED ACCESS CONTROL
 * 
 * For developers implementing or modifying admin features
 */

// ========================================
// HOW TO CHECK ADMIN ROLE IN FRONTEND
// ========================================

// In any React component:
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function MyComponent() {
  const { admin } = useContext(AuthContext);

  // Check if MAIN_ADMIN
  if (admin?.role === 'MAIN_ADMIN') {
    // Show admin management features
  }

  // Check if SUB_ADMIN
  if (admin?.role === 'SUB_ADMIN') {
    // Show limited features only
  }

  return (
    <div>
      {admin?.role === 'MAIN_ADMIN' && (
        <button>Admin Only Feature</button>
      )}
    </div>
  );
}

// ========================================
// HOW TO PROTECT ROUTES IN FRONTEND
// ========================================

// For routes accessible to all admins:
<Route path="/admin/dashboard" element={
  <AdminRoute><AdminDashboard /></AdminRoute>
} />

// For routes accessible ONLY to MAIN_ADMIN:
<Route path="/admin/admin-management" element={
  <MainAdminRoute><AdminManagement /></MainAdminRoute>
} />

// ========================================
// HOW TO PROTECT ROUTES IN BACKEND
// ========================================

// For routes accessible to all authenticated admins:
router.get('/api/products', adminProtect, productController.getProducts);

// For routes accessible ONLY to MAIN_ADMIN:
router.post(
  '/api/admin-management/admins',
  adminProtect,           // Require authentication
  mainAdminOnly,          // Require MAIN_ADMIN role
  adminManagementController.createAdmin
);

// ========================================
// API RESPONSE CODES
// ========================================

// 200 OK - Success
// {
//   success: true,
//   message: "Operation successful",
//   data: { ... }
// }

// 401 Unauthorized - No token or invalid token
// {
//   success: false,
//   message: "Not authorized to access admin panel"
// }

// 403 Forbidden - Authenticated but insufficient role
// {
//   success: false,
//   message: "Access denied. Admin management is restricted."
// }

// 404 Not Found - Resource doesn't exist
// {
//   success: false,
//   message: "Admin not found"
// }

// 500 Server Error - Internal server error
// {
//   success: false,
//   message: "Error message here"
// }

// ========================================
// ROLE DETERMINATION RULES
// ========================================

// EMAIL-BASED ROLE ASSIGNMENT
// Applied automatically in adminLogin and createAdmin

function assignRole(email) {
  return email === 'manielectricals@gmail.com' ? 'MAIN_ADMIN' : 'SUB_ADMIN';
}

// MAIN_ADMIN: manielectricals@gmail.com
// SUB_ADMIN: any other email

// CANNOT BE CHANGED:
// - Frontend has no role selector for admins
// - Backend ignores role parameter in API requests
// - Role is auto-assigned based on email only
// - Role cannot be updated via updateAdmin endpoint

// ========================================
// JWT TOKEN STRUCTURE
// ========================================

// Token is JWT signed with process.env.JWT_SECRET
// Payload contains:
{
  id: "admin_database_id",
  role: "MAIN_ADMIN" || "SUB_ADMIN",
  iat: timestamp,
  exp: timestamp
}

// Extracted in adminProtect middleware:
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.admin.role = decoded.role;

// ========================================
// ERROR HANDLING EXAMPLES
// ========================================

// In Frontend - Handle 403 Forbidden
try {
  const response = await API.get('/admin-management/admins', {
    headers: { Authorization: `Bearer ${token}` }
  });
} catch (error) {
  if (error.response?.status === 403) {
    // SUB_ADMIN trying to access MAIN_ADMIN feature
    showToast('Access denied. Admin management is restricted.', 'error');
    navigate('/admin/dashboard');
  }
}

// In Backend - Middleware validation
exports.mainAdminOnly = (req, res, next) => {
  if (req.admin.role !== 'MAIN_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin management is restricted.'
    });
  }
  next();
};

// ========================================
// DEBUGGING ROLE ISSUES
// ========================================

// Check admin object in browser console
// Login as admin and run in DevTools Console:
console.log(localStorage.getItem('admin'));
// Should show: { ..., role: 'MAIN_ADMIN' | 'SUB_ADMIN' }

// Check JWT token contents
// Paste token in: https://jwt.io
// Payload should include:
// { id: "...", role: "MAIN_ADMIN" | "SUB_ADMIN" }

// Check database
// In MongoDB, verify admin document has role field:
db.admins.findOne({ email: 'manielectricals@gmail.com' });
// Should return: { ..., role: 'MAIN_ADMIN' }

// Run verification script
// node verify-rbac.js
// Shows all implementation checks and testing checklist

// ========================================
// COMMON MISTAKES TO AVOID
// ========================================

// ❌ WRONG: Checking email instead of role
if (admin?.email === 'manielectricals@gmail.com') { ... }

// ✓ CORRECT: Check role field
if (admin?.role === 'MAIN_ADMIN') { ... }

// ❌ WRONG: Using only frontend protection
if (admin?.role !== 'MAIN_ADMIN') return;
// Attacker can modify localStorage

// ✓ CORRECT: Protect on both frontend AND backend
// Frontend: Prevent navigation, hide buttons
// Backend: Middleware validates role in JWT

// ❌ WRONG: Allowing role to be set in API request
const { name, email, password, role } = req.body;
// User can set role to 'MAIN_ADMIN'

// ✓ CORRECT: Auto-assign role from email
const role = email === 'manielectricals@gmail.com' ? 'MAIN_ADMIN' : 'SUB_ADMIN';

// ❌ WRONG: Only protecting admin-management routes
router.get('/api/admin/data', adminProtect, ...);
// Other routes might allow role changes

// ✓ CORRECT: Auto-assign role everywhere
// All createAdmin/updateAdmin endpoints auto-assign role

// ========================================
// WHEN TO USE WHICH ROUTE PROTECTION
// ========================================

// Use AdminRoute:
// - Routes accessible to any authenticated admin
// - /admin/dashboard
// - /admin/products
// - /admin/orders
// - /admin/customers

// Use MainAdminRoute:
// - Routes ONLY for MAIN_ADMIN
// - /admin/admin-management

// Use adminProtect middleware:
// - API endpoints accessible to all authenticated admins
// - /api/products
// - /api/orders

// Use adminProtect + mainAdminOnly middleware:
// - API endpoints ONLY for MAIN_ADMIN
// - /api/admin-management/*

// ========================================
// TESTING ROLE-BASED FEATURES
// ========================================

// Test as MAIN_ADMIN
// Email: manielectricals@gmail.com
// Password: Mani1234

// Test as SUB_ADMIN
// Email: admin@electricshop.com
// Password: [test password]

// Expected behaviors:
// MAIN_ADMIN:
//   ✓ Can access /admin/admin-management
//   ✓ See "Admin Management" menu
//   ✓ Can add/edit/delete admins
//   ✓ Can make API calls to /api/admin-management/*

// SUB_ADMIN:
//   ✗ Cannot access /admin/admin-management (redirected)
//   ✗ Cannot see "Admin Management" menu
//   ✗ Cannot add/edit/delete admins
//   ✗ API returns 403 for admin-management routes

// ========================================
// FILE REFERENCE
// ========================================

// Core implementation:
// - backend/middleware/auth.js (adminProtect, mainAdminOnly)
// - backend/controllers/authController.js (role assignment)
// - backend/utils/generateToken.js (JWT with role)
// - frontend/src/components/MainAdminRoute.jsx (route protection)
// - frontend/src/components/AdminLayout.jsx (menu visibility)

// Admin management:
// - backend/routes/adminManagementRoutes.js
// - backend/controllers/adminManagementController.js
// - frontend/src/pages/admin/AdminManagement.jsx

// Configuration:
// - backend/models/Admin.js (role enum)
// - frontend/src/App.jsx (route definitions)
// - frontend/src/context/AuthContext.jsx (admin state)

// Testing:
// - verify-rbac.js (verification script)
// - RBAC_IMPLEMENTATION.js (detailed documentation)

// ========================================
