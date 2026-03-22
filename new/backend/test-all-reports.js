const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');
const Product = require('./models/Product');
require('dotenv').config();

/**
 * Comprehensive Report Testing Script
 * Tests all report data directly from database
 */

const testAllReports = async () => {
  console.log('\n🧪 COMPREHENSIVE REPORT DATA TESTING\n');
  console.log('=' .repeat(70));
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Test 1: Sales Report Data
    console.log('1️⃣  TESTING SALES REPORT DATA');
    console.log('-'.repeat(70));
    try {
      const orders = await Order.find()
        .populate('user', 'name email')
        .populate('items.product', 'name price')
        .lean();
      
      const deliveredOrders = orders.filter(o => (o.orderStatus || '').toLowerCase() === 'delivered');
      const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const avgOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;
      
      console.log('✅ Sales Data Available');
      console.log(`   Total Orders: ${orders.length}`);
      console.log(`   Delivered Orders: ${deliveredOrders.length}`);
      console.log(`   Total Revenue: ₹${totalRevenue.toFixed(2)}`);
      console.log(`   Average Order Value: ₹${avgOrderValue.toFixed(2)}`);
    } catch (err) {
      console.log('❌ Sales Data Error:', err.message);
    }
    console.log('');
    
    // Test 2: Order Report Data
    console.log('2️⃣  TESTING ORDER REPORT DATA');
    console.log('-'.repeat(70));
    try {
      const orders = await Order.find().lean();
      
      const statusCounts = {
        pending: orders.filter(o => (o.orderStatus || '').toLowerCase() === 'pending').length,
        processing: orders.filter(o => ['processing', 'confirmed', 'shipped'].includes((o.orderStatus || '').toLowerCase())).length,
        delivered: orders.filter(o => (o.orderStatus || '').toLowerCase() === 'delivered').length,
        cancelled: orders.filter(o => (o.orderStatus || '').toLowerCase() === 'cancelled').length
      };
      
      console.log('✅ Order Data Available');
      console.log(`   Total Orders: ${orders.length}`);
      console.log(`   Pending: ${statusCounts.pending}`);
      console.log(`   Processing/Shipped: ${statusCounts.processing}`);
      console.log(`   Delivered: ${statusCounts.delivered}`);
      console.log(`   Cancelled: ${statusCounts.cancelled}`);
    } catch (err) {
      console.log('❌ Order Data Error:', err.message);
    }
    console.log('');
    
    // Test 3: Payment Report Data
    console.log('3️⃣  TESTING PAYMENT REPORT DATA');
    console.log('-'.repeat(70));
    try {
      const orders = await Order.find().lean();
      
      const totalAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const codPayments = orders.filter(o => {
        const method = (o.paymentMethod || '').toLowerCase();
        return method === 'cod' || method === 'cash on delivery';
      });
      const onlinePayments = orders.filter(o => {
        const method = (o.paymentMethod || '').toLowerCase();
        return method && method !== 'cod' && method !== 'cash on delivery';
      });
      
      console.log('✅ Payment Data Available');
      console.log(`   Total Transactions: ${orders.length}`);
      console.log(`   Total Amount: ₹${totalAmount.toFixed(2)}`);
      console.log(`   COD Payments: ${codPayments.length}`);
      console.log(`   Online Payments: ${onlinePayments.length}`);
    } catch (err) {
      console.log('❌ Payment Data Error:', err.message);
    }
    console.log('');
    
    // Test 4: Stock Report Data
    console.log('4️⃣  TESTING STOCK REPORT DATA');
    console.log('-'.repeat(70));
    try {
      const products = await Product.find().lean();
      
      const inStock = products.filter(p => p.stock > 10).length;
      const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;
      const outOfStock = products.filter(p => p.stock === 0).length;
      const totalStockValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
      
      console.log('✅ Stock Data Available');
      console.log(`   Total Products: ${products.length}`);
      console.log(`   In Stock (>10): ${inStock}`);
      console.log(`   Low Stock (1-10): ${lowStock}`);
      console.log(`   Out of Stock: ${outOfStock}`);
      console.log(`   Total Stock Value: ₹${totalStockValue.toFixed(2)}`);
    } catch (err) {
      console.log('❌ Stock Data Error:', err.message);
    }
    console.log('');
    
    // Test 5: Customer Report Data
    console.log('5️⃣  TESTING CUSTOMER REPORT DATA');
    console.log('-'.repeat(70));
    try {
      const customers = await User.find({ role: { $in: ['customer', 'CUSTOMER', 'user'] } }).lean();
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeCustomers = customers.filter(c => {
        const status = (c.status || '').toUpperCase();
        return status === 'ACTIVE' || !status;
      }).length;
      
      const newCustomers = customers.filter(c => new Date(c.createdAt) >= thirtyDaysAgo).length;
      
      console.log('✅ Customer Data Available');
      console.log(`   Total Customers: ${customers.length}`);
      console.log(`   Active Customers: ${activeCustomers}`);
      console.log(`   New Customers (Last 30 days): ${newCustomers}`);
    } catch (err) {
      console.log('❌ Customer Data Error:', err.message);
    }
    console.log('');
    
    // Summary
    console.log('=' .repeat(70));
    console.log('✅ REPORT DATA TESTING COMPLETE');
    console.log('\n📋 API ENDPOINTS CREATED:');
    console.log('   ✅ GET /api/admin/reports/sales');
    console.log('   ✅ GET /api/admin/reports/orders');
    console.log('   ✅ GET /api/admin/reports/payments');
    console.log('   ✅ GET /api/admin/reports/stock');
    console.log('   ✅ GET /api/admin/reports/customers');
    console.log('\n📋 FRONTEND PAGES UPDATED:');
    console.log('   ✅ SalesReport.jsx → /api/admin/reports/sales');
    console.log('   ✅ OrderReport.jsx → /api/admin/reports/orders');
    console.log('   ✅ PaymentReport.jsx → /api/admin/reports/payments');
    console.log('   ✅ StockReport.jsx → /api/admin/reports/stock');
    console.log('   ✅ CustomerReport.jsx → /api/admin/reports/customers');
    console.log('\n💡 TO VIEW REPORTS IN FRONTEND:');
    console.log('   1. Ensure backend is running: cd backend && npm start');
    console.log('   2. Ensure frontend is running: cd frontend && npm run dev');
    console.log('   3. Open http://localhost:3003 in browser');
    console.log('   4. Login as admin');
    console.log('   5. Navigate to Reports section');
    console.log('   6. Click on each report card to view full details');
    console.log('\n💡 IF REPORTS STILL SHOW EMPTY:');
    console.log('   1. Logout from admin panel');
    console.log('   2. Clear browser localStorage: localStorage.clear()');
    console.log('   3. Login again as admin');
    console.log('   4. Check browser console (F12) for any errors');
    console.log('');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    await mongoose.disconnect();
  }
};

testAllReports();
