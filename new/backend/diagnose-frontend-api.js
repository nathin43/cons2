const axios = require('axios');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

/**
 * Diagnostic Tool: Check if Frontend can access Backend API
 * This simulates what the frontend does
 */

const diagnose = async () => {
  console.log('\n🔍 DIAGNOSING FRONTEND-BACKEND CONNECTION\n');
  console.log('=' .repeat(60));
  
  // 1. Check if backend is running
  console.log('\n1️⃣  Checking Backend Server Status...');
  try {
    const response = await axios.get(`http://localhost:${PORT}/api/health`, { timeout: 5000 });
    console.log('   ✅ Backend is running on port', PORT);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.log(`   ❌ Backend is NOT running on port ${PORT}`);
      console.log(`   💡 Start backend: cd backend && npm start`);
      return;
    }
  }
  
  // 2. Test /api/orders endpoint WITHOUT token
  console.log('\n2️⃣  Testing /api/orders WITHOUT admin token...');
  try {
    const response = await axios.get(`http://localhost:${PORT}/api/orders`);
    console.log('   ⚠️ Endpoint accessible without token (should require admin auth)');
    console.log('   Response:', response.data);
  } catch (err) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      console.log('   ✅ Endpoint correctly requires authentication');
    } else {
      console.log('   ❌ Unexpected error:', err.message);
    }
  }
  
  // 3. Test /api/orders endpoint WITH admin token
  console.log('\n3️⃣  Testing /api/orders WITH admin token...');
  
  // Get admin from database
  const mongoose = require('mongoose');
  const User = require('./models/User');
  const jwt = require('jsonwebtoken');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const admin = await User.findOne({ role: { $in: ['admin', 'ADMIN', 'MAIN_ADMIN', 'SUB_ADMIN'] } });
    
    if (!admin) {
      console.log('   ❌ No admin user found in database');
      await mongoose.disconnect();
      return;
    }
    
    // Generate token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log(`   📝 Using admin: ${admin.name} (${admin.email})`);
    console.log(`   🔑 Token generated: ${token.substring(0, 20)}...`);
    
    // Make request with token
    const response = await axios.get(`http://localhost:${PORT}/api/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n   ✅ API Request Successful!');
    console.log('   📊 Response Status:', response.status);
    console.log('   📦 Orders Found:', response.data.count || response.data.orders?.length || 0);
    console.log('   💰 Total Sales:', response.data.totalSales || 'N/A');
    
    if (response.data.orders && response.data.orders.length > 0) {
      console.log('\n   Sample Order:');
      const sample = response.data.orders[0];
      console.log('      - Order ID:', sample._id);
      console.log('      - Total Amount:', sample.totalAmount);
      console.log('      - Status:', sample.orderStatus);
      console.log('      - Created:', new Date(sample.createdAt).toLocaleDateString());
    }
    
    // 4. Simulate frontend request
    console.log('\n4️⃣  Simulating Frontend Request...');
    console.log('   Frontend URL: http://localhost:3003');
    console.log('   API calls go to: /api/orders');
    console.log('   Vite proxy forwards to: http://localhost:' + PORT);
    console.log('\n   💡 What frontend does:');
    console.log('      1. Gets adminToken from localStorage');
    console.log('      2. Makes request to: /api/orders');
    console.log('      3. Axios interceptor adds: Authorization: Bearer <token>');
    console.log('      4. Vite proxy forwards to backend');
    
    console.log('\n5️⃣  Possible Issues if Reports Still Empty:');
    console.log('   ❌ Frontend not running (npm run dev in frontend folder)');
    console.log('   ❌ No admin token in localStorage');
    console.log('   ❌ Admin logged out or token expired');
    console.log('   ❌ Browser console shows errors');
    console.log('   ❌ CORS or proxy misconfiguration');
    
    console.log('\n6️⃣  Quick Fixes:');
    console.log('   ✅ Clear browser localStorage and login again');
    console.log('   ✅ Check browser console (F12) for errors');
    console.log('   ✅ Verify frontend is on port 3003');
    console.log('   ✅ Verify backend is on port', PORT);
    console.log('   ✅ Restart both servers if needed');
    
    await mongoose.disconnect();
    
  } catch (err) {
    console.log('   ❌ Error:', err.response?.data || err.message);
    await mongoose.disconnect();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnosis Complete\n');
};

diagnose();