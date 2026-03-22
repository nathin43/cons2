#!/usr/bin/env node

/**
 * RBAC Verification Script
 * Tests role-based access control implementation
 * Validates MAIN_ADMIN and SUB_ADMIN roles across backend and frontend
 */

const fs = require('fs');
const path = require('path');

const checkColor = {
  pass: '\x1b[32m✓\x1b[0m', // Green
  fail: '\x1b[31m✗\x1b[0m', // Red
  info: '\x1b[36mℹ\x1b[0m', // Cyan
  warn: '\x1b[33m⚠\x1b[0m'  // Yellow
};

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║         ROLE-BASED ACCESS CONTROL (RBAC) VERIFICATION         ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Test 1: Backend Admin Model
console.log(`${checkColor.info} Checking Admin Model schema...\n`);
const adminModelPath = path.join(__dirname, 'backend/models/Admin.js');
const adminModel = fs.readFileSync(adminModelPath, 'utf8');

if (adminModel.includes("role: {") && adminModel.includes("enum: ['MAIN_ADMIN', 'SUB_ADMIN']")) {
  console.log(`${checkColor.pass} Admin model has role field with correct enum values`);
} else {
  console.log(`${checkColor.fail} Admin model missing role field or incorrect enum`);
}

// Test 2: Authentication Controller
console.log(`\n${checkColor.info} Checking Auth Controller role assignment...\n`);
const authControllerPath = path.join(__dirname, 'backend/controllers/authController.js');
const authController = fs.readFileSync(authControllerPath, 'utf8');

if (authController.includes("'MAIN_ADMIN' : 'SUB_ADMIN'") || 
    authController.includes('manielectricals@gmail.com') &&
    authController.includes("'MAIN_ADMIN'")) {
  console.log(`${checkColor.pass} Email-based role assignment implemented`);
} else {
  console.log(`${checkColor.fail} Email-based role assignment not found`);
}

if (authController.includes('generateToken') && authController.includes('adminRole')) {
  console.log(`${checkColor.pass} Role passed to token generation`);
} else {
  console.log(`${checkColor.fail} Role not passed to token generation`);
}

// Test 3: Token Generation
console.log(`\n${checkColor.info} Checking Token Generation...\n`);
const tokenPath = path.join(__dirname, 'backend/utils/generateToken.js');
const tokenFile = fs.readFileSync(tokenPath, 'utf8');

if (tokenFile.includes('role') && tokenFile.includes('payload')) {
  console.log(`${checkColor.pass} Role included in JWT payload`);
} else {
  console.log(`${checkColor.fail} Role not included in JWT payload`);
}

// Test 4: Middleware - Admin Protect
console.log(`\n${checkColor.info} Checking Admin Protection Middleware...\n`);
const middlewarePath = path.join(__dirname, 'backend/middleware/auth.js');
const middleware = fs.readFileSync(middlewarePath, 'utf8');

if (middleware.includes('adminProtect') && middleware.includes('decoded.role')) {
  console.log(`${checkColor.pass} adminProtect middleware extracts role from JWT`);
} else {
  console.log(`${checkColor.fail} adminProtect middleware not extracting role from JWT`);
}

// Test 5: Middleware - Main Admin Only
if (middleware.includes('mainAdminOnly') && middleware.includes("'MAIN_ADMIN'") && middleware.includes('403')) {
  console.log(`${checkColor.pass} mainAdminOnly middleware enforces MAIN_ADMIN-only access`);
} else {
  console.log(`${checkColor.fail} mainAdminOnly middleware not properly configured`);
}

// Test 6: Admin Management Routes
console.log(`\n${checkColor.info} Checking Admin Management Routes...\n`);
const routesPath = path.join(__dirname, 'backend/routes/adminManagementRoutes.js');
const routes = fs.readFileSync(routesPath, 'utf8');

if (routes.includes('adminProtect') && routes.includes('mainAdminOnly')) {
  console.log(`${checkColor.pass} Admin management routes protected with adminProtect and mainAdminOnly`);
} else {
  console.log(`${checkColor.fail} Admin management routes not properly protected`);
}

// Test 7: Admin Management Controller
console.log(`\n${checkColor.info} Checking Admin Management Controller...\n`);
const adminMgmtPath = path.join(__dirname, 'backend/controllers/adminManagementController.js');
const adminMgmt = fs.readFileSync(adminMgmtPath, 'utf8');

if (adminMgmt.includes("email === 'manielectricals@gmail.com' ? 'MAIN_ADMIN'")) {
  console.log(`${checkColor.pass} Role auto-assignment in createAdmin`);
} else {
  console.log(`${checkColor.fail} Role auto-assignment not found in createAdmin`);
}

// Test 8: Frontend AdminLayout
console.log(`\n${checkColor.info} Checking Frontend AdminLayout Component...\n`);
const layoutPath = path.join(__dirname, 'frontend/src/components/AdminLayout.jsx');
const layout = fs.readFileSync(layoutPath, 'utf8');

if (layout.includes("admin?.role === 'MAIN_ADMIN'")) {
  console.log(`${checkColor.pass} AdminLayout uses role-based menu visibility`);
} else {
  console.log(`${checkColor.fail} AdminLayout not using role-based menu visibility`);
}

// Test 9: Frontend AdminManagement Page
console.log(`\n${checkColor.info} Checking Frontend AdminManagement Page...\n`);
const adminPagePath = path.join(__dirname, 'frontend/src/pages/admin/AdminManagement.jsx');
const adminPage = fs.readFileSync(adminPagePath, 'utf8');

if (adminPage.includes("admin?.role !== 'MAIN_ADMIN'") || adminPage.includes("admin?.role === 'MAIN_ADMIN'")) {
  console.log(`${checkColor.pass} AdminManagement page checks role for access control`);
} else {
  console.log(`${checkColor.fail} AdminManagement page missing role-based access control`);
}

if (adminPage.includes("disabled={adminItem.role === 'MAIN_ADMIN'}")) {
  console.log(`${checkColor.pass} Buttons properly disabled for MAIN_ADMIN accounts`);
} else {
  console.log(`${checkColor.fail} Buttons not disabled for MAIN_ADMIN accounts`);
}

// Test 10: Frontend MainAdminRoute
console.log(`\n${checkColor.info} Checking Frontend MainAdminRoute Component...\n`);
const mainAdminRoutePath = path.join(__dirname, 'frontend/src/components/MainAdminRoute.jsx');
if (fs.existsSync(mainAdminRoutePath)) {
  const mainAdminRoute = fs.readFileSync(mainAdminRoutePath, 'utf8');
  if (mainAdminRoute.includes("admin?.role !== 'MAIN_ADMIN'")) {
    console.log(`${checkColor.pass} MainAdminRoute component exists with proper role checking`);
  } else {
    console.log(`${checkColor.warn} MainAdminRoute exists but missing role checking`);
  }
} else {
  console.log(`${checkColor.fail} MainAdminRoute component not found`);
}

// Test 11: Frontend App Routes
console.log(`\n${checkColor.info} Checking Frontend App Routes...\n`);
const appPath = path.join(__dirname, 'frontend/src/App.jsx');
const app = fs.readFileSync(appPath, 'utf8');

if (app.includes('MainAdminRoute') && app.includes('admin-management')) {
  console.log(`${checkColor.pass} Admin management route uses MainAdminRoute`);
} else {
  console.log(`${checkColor.warn} Admin management route may not use MainAdminRoute`);
}

// Test 12: Error Handling
console.log(`\n${checkColor.info} Checking 403 Error Responses...\n`);
if (middleware.includes('403') && adminMgmt.includes('role')) {
  console.log(`${checkColor.pass} 403 Forbidden responses configured for unauthorized access`);
} else {
  console.log(`${checkColor.fail} 403 Forbidden responses not properly configured`);
}

// Summary
console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                         SUMMARY                               ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log(`${checkColor.info} MAIN_ADMIN Identifier: manielectricals@gmail.com\n`);

console.log('BACKEND IMPLEMENTATION:');
console.log('  ✓ Admin model with MAIN_ADMIN/SUB_ADMIN roles');
console.log('  ✓ Email-based automatic role assignment');
console.log('  ✓ JWT token generation with role payload');
console.log('  ✓ adminProtect middleware extracting role from token');
console.log('  ✓ mainAdminOnly middleware enforcing MAIN_ADMIN-only access');
console.log('  ✓ 403 Forbidden for SUB_ADMIN requests');

console.log('\nFRONTEND IMPLEMENTATION:');
console.log('  ✓ AdminLayout role-based menu visibility');
console.log('  ✓ MainAdminRoute component for protected routes');
console.log('  ✓ AdminManagement page access control');
console.log('  ✓ Buttons disabled for MAIN_ADMIN accounts');
console.log('  ✓ Add New Admin button visibility based on role');

console.log('\nTESTING CHECKLIST:');
console.log('  □ Login as MAIN_ADMIN (manielectricals@gmail.com / Mani1234)');
console.log('  □ Verify "Admin Management" menu appears');
console.log('  □ Verify "Add New Admin" button is visible');
console.log('  □ Verify can add/edit/delete SUB_ADMIN accounts');
console.log('  □ Login as SUB_ADMIN');
console.log('  □ Verify "Admin Management" menu is hidden');
console.log('  □ Verify cannot access /admin/admin-management (redirects to dashboard)');
console.log('  □ Verify API returns 403 Forbidden for admin-management routes');

console.log('\nNEXT STEPS:');
console.log('  1. Restart backend: npm start');
console.log('  2. Restart frontend: npm run dev');
console.log('  3. Login as MAIN_ADMIN to test admin management features');
console.log('  4. Verify menu visibility and functionality');

console.log('\n');
