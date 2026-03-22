// QUICK FIX FOR REPORTS NOT SHOWING
// Run this in the Browser Console (F12) while on the admin pages

console.log('=== REPORT FIX DIAGNOSTIC ===\n');

// Check 1: Is admin logged in?
const adminToken = localStorage.getItem('adminToken');
const admin = localStorage.getItem('admin');

console.log('1. Admin Token:', adminToken ? '✅ Present' : '❌ MISSING');
console.log('2. Admin Data:', admin ? '✅ Present' : '❌ MISSING');

if (admin) {
  try {
    const adminData = JSON.parse(admin);
    console.log('3. Admin Info:', adminData.name, '-', adminData.email);
    console.log('4. Admin Role:', adminData.role);
  } catch (e) {
    console.log('3. Admin Data: ❌ CORRUPTED');
  }
}

if (!adminToken || !admin) {
  console.log('\n❌ PROBLEM: Admin not logged in or token missing');
  console.log('✅ SOLUTION: Logout and login again');
  console.log('\n   To logout, run: localStorage.clear(); window.location.href="/admin/login";');
} else {
  console.log('\n✅ Admin authentication looks good');
  console.log('💡 If reports still empty, check Network tab for API errors');
}

console.log('\n=== END DIAGNOSTIC ===');
