const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Test Admin Authentication for Reports
 * Generates a valid admin token to test API endpoints
 */
const testAdminAuth = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find an admin
    const admin = await Admin.findOne({});
    
    if (!admin) {
      console.log('❌ No admin found in database');
      console.log('💡 Please create an admin first\n');
      await mongoose.disconnect();
      return;
    }

    console.log('👨‍💼 Admin Found:');
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin._id}\n`);

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    console.log('🔑 Admin Token Generated:\n');
    console.log(token);
    console.log('\n📝 To test the API endpoints:\n');
    console.log('1. Open your API client (Postman/Insomnia/Thunder Client)');
    console.log('2. Create a GET request to: http://localhost:5000/api/orders');
    console.log('3. Add header:');
    console.log('   Authorization: Bearer ' + token.substring(0, 30) + '...\n');
    console.log('OR use curl:\n');
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:5000/api/orders\n`);

    console.log('💡 For frontend testing:');
    console.log('1. Open browser DevTools (F12)');
    console.log('2. Go to Application/Storage tab');
    console.log('3. Find localStorage');
    console.log('4. Set "adminToken" to the token above');
    console.log('5. Refresh the admin reports page\n');

    // Check if backend server is running
    console.log('⚠️  IMPORTANT: Make sure your backend server is running!');
    console.log('   Run: cd backend && npm start\n');

    await mongoose.disconnect();
    console.log('✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testAdminAuth();
