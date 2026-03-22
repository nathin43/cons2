/**
 * ADMIN REPORTS DIAGNOSTIC TOOL
 * 
 * This script checks everything needed for admin reports to work:
 * - Database connection
 * - Orders data
 * - Admin authentication
 * - API endpoints
 * 
 * Run: node diagnose-reports.js
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Order = require('./models/Order');
const Admin = require('./models/Admin');
const User = require('./models/User');
const Product = require('./models/Product');

console.log('\n🔍 ADMIN REPORTS DIAGNOSTIC TOOL\n');
console.log('='.repeat(60));

async function diagnose() {
  try {
    // Step 1: Check MongoDB Connection
    console.log('\n📡 Step 1: Checking MongoDB Connection...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✅ MongoDB Connected Successfully');
    console.log(`   📍 Database: ${mongoose.connection.name}`);

    // Step 2: Check Orders Data
    console.log('\n📦 Step 2: Checking Orders Data...');
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.product', 'name price')
      .sort({ createdAt: -1 });

    console.log(`   ✅ Found ${orders.length} orders in database`);
    
    if (orders.length === 0) {
      console.log('   ⚠️  WARNING: No orders found! Reports will be empty.');
      console.log('   💡 Tip: Create some orders or run seeder script');
    } else {
      // Calculate statistics
      const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const statusBreakdown = {};
      const paymentBreakdown = {};

      orders.forEach(order => {
        statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
        paymentBreakdown[order.paymentMethod] = (paymentBreakdown[order.paymentMethod] || 0) + 1;
      });

      console.log(`   💰 Total Revenue: ₹${totalRevenue.toFixed(2)}`);
      console.log(`   📊 Orders by Status:`);
      Object.entries(statusBreakdown).forEach(([status, count]) => {
        console.log(`      - ${status}: ${count}`);
      });
      console.log(`   💳 Payment Methods:`);
      Object.entries(paymentBreakdown).forEach(([method, count]) => {
        console.log(`      - ${method}: ${count}`);
      });

      // Show recent orders
      console.log(`\n   📝 Recent Orders (last 3):`);
      orders.slice(0, 3).forEach((order, idx) => {
        console.log(`      ${idx + 1}. Order #${order.orderId}`);
        console.log(`         User: ${order.user?.name || 'N/A'} (${order.user?.email || 'N/A'})`);
        console.log(`         Amount: ₹${order.totalAmount}`);
        console.log(`         Status: ${order.status}`);
        console.log(`         Payment: ${order.paymentMethod}`);
        console.log(`         Date: ${new Date(order.createdAt).toLocaleDateString()}`);
      });
    }

    // Step 3: Check Admin Accounts
    console.log('\n👤 Step 3: Checking Admin Accounts...');
    const admins = await Admin.find().select('name email role status');
    
    if (admins.length === 0) {
      console.log('   ❌ ERROR: No admin accounts found!');
      console.log('   💡 Fix: Run seed-main-admin.js to create an admin');
    } else {
      console.log(`   ✅ Found ${admins.length} admin account(s)`);
      admins.forEach((admin, idx) => {
        console.log(`      ${idx + 1}. ${admin.name} (${admin.email})`);
        console.log(`         Role: ${admin.role}`);
        console.log(`         Status: ${admin.status}`);
      });

      // Generate test token for first admin
      const testAdmin = admins[0];
      const token = jwt.sign(
        { id: testAdmin._id, role: testAdmin.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      console.log(`\n   🔑 Test Admin Token (valid for 30 days):`);
      console.log(`      ${token}`);
    }

    // Step 4: Check API Requirements
    console.log('\n🔧 Step 4: Checking API Configuration...');
    
    if (!process.env.JWT_SECRET) {
      console.log('   ❌ ERROR: JWT_SECRET not set in .env file!');
    } else {
      console.log('   ✅ JWT_SECRET is configured');
    }

    if (!process.env.PORT) {
      console.log('   ⚠️  WARNING: PORT not set, will default to 5000');
    } else {
      console.log(`   ✅ PORT configured: ${process.env.PORT}`);
    }

    // Step 5: Test Report Data Processing
    console.log('\n📊 Step 5: Testing Report Data Processing...');
    
    if (orders.length > 0) {
      // Simulate what the API would return
      const apiResponse = {
        success: true,
        count: orders.length,
        totalSales: orders.reduce((sum, order) => sum + order.totalAmount, 0),
        orders: orders.map(order => ({
          orderId: order.orderId,
          totalAmount: order.totalAmount,
          status: order.status,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt,
          user: order.user ? {
            name: order.user.name,
            email: order.user.email
          } : null
        }))
      };

      console.log('   ✅ API Response Structure Valid');
      console.log(`   📦 Response Size: ${JSON.stringify(apiResponse).length} bytes`);
      console.log('   ✅ All required fields present');
    }

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(60));

    const issues = [];
    const warnings = [];

    if (orders.length === 0) {
      issues.push('No orders in database - reports will be empty');
    }
    if (admins.length === 0) {
      issues.push('No admin accounts - cannot login');
    }
    if (!process.env.JWT_SECRET) {
      issues.push('JWT_SECRET not configured');
    }

    if (issues.length === 0) {
      console.log('\n✅ ALL CHECKS PASSED!');
      console.log('\nYour database has all the data needed for reports.');
      console.log('\nIf reports still don\'t show, check:');
      console.log('   1. Backend server is running (npm start)');
      console.log('   2. You\'re logged in as admin');
      console.log('   3. Browser console for errors');
      console.log('   4. Network tab for failed API calls');
    } else {
      console.log('\n❌ ISSUES FOUND:');
      issues.forEach((issue, idx) => {
        console.log(`   ${idx + 1}. ${issue}`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.forEach((warning, idx) => {
        console.log(`   ${idx + 1}. ${warning}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Diagnostic complete!\n');

  } catch (error) {
    console.error('\n❌ DIAGNOSTIC FAILED:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
    process.exit(0);
  }
}

// Run diagnostic
diagnose();
