const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
require('dotenv').config();

/**
 * Test Stock and Customer Report Endpoints
 */

const testStockAndCustomerReports = async () => {
  console.log('\n🧪 TESTING STOCK AND CUSTOMER REPORTS\n');
  console.log('=' .repeat(70));
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Test 1: Stock Report Data
    console.log('1️⃣  TESTING STOCK REPORT DATA');
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
      
      if (products.length > 0) {
        console.log('\n   Sample Products:');
        products.slice(0, 3).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.name} - Stock: ${p.stock} - Price: ₹${p.price}`);
        });
      }
      
      // Test the controller logic
      const categoryBreakdown = {};
      products.forEach(product => {
        const cat = product.category || 'Uncategorized';
        if (!categoryBreakdown[cat]) {
          categoryBreakdown[cat] = { count: 0, totalStock: 0, totalValue: 0 };
        }
        categoryBreakdown[cat].count++;
        categoryBreakdown[cat].totalStock += product.stock || 0;
        categoryBreakdown[cat].totalValue += (product.price || 0) * (product.stock || 0);
      });
      
      console.log('\n   Categories:');
      Object.keys(categoryBreakdown).slice(0, 5).forEach(cat => {
        console.log(`   - ${cat}: ${categoryBreakdown[cat].count} products, ${categoryBreakdown[cat].totalStock} units`);
      });
      
    } catch (err) {
      console.log('❌ Stock Data Error:', err.message);
      console.log('   Stack:', err.stack);
    }
    console.log('');
    
    // Test 2: Customer Report Data
    console.log('2️⃣  TESTING CUSTOMER REPORT DATA');
    console.log('-'.repeat(70));
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date(now);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const userFilters = { role: { $in: ['customer', 'CUSTOMER', 'user'] } };
      
      const pipeline = [
        { $match: userFilters },
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'user',
            as: 'orders'
          }
        },
        {
          $addFields: {
            totalOrders: { $size: '$orders' },
            totalSpent: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$orders',
                      as: 'order',
                      cond: { $eq: [{ $toLower: { $ifNull: ['$$order.orderStatus', ''] } }, 'delivered'] }
                    }
                  },
                  as: 'order',
                  in: { $ifNull: ['$$order.totalAmount', 0] }
                }
              }
            },
            lastOrderDate: { $max: '$orders.createdAt' },
            actualStatus: {
              $switch: {
                branches: [
                  { case: { $eq: ['$status', 'BLOCKED'] }, then: 'BLOCKED' },
                  { case: { $eq: ['$status', 'SUSPENDED'] }, then: 'SUSPENDED' },
                  { case: { $lt: ['$lastLoginAt', sixtyDaysAgo] }, then: 'INACTIVE' }
                ],
                default: 'ACTIVE'
              }
            }
          }
        },
        { $sort: { createdAt: -1 } },
        { $project: { password: 0, orders: 0 } }
      ];
      
      const users = await User.aggregate(pipeline);
      
      const totalCustomers = users.length;
      const activeCustomers = users.filter(u => u.actualStatus === 'ACTIVE').length;
      const newCustomers = users.filter(u => new Date(u.createdAt) >= thirtyDaysAgo).length;
      const totalRevenue = users.reduce((sum, u) => sum + (u.totalSpent || 0), 0);
      const averageOrdersPerCustomer = totalCustomers > 0 ? users.reduce((sum, u) => sum + (u.totalOrders || 0), 0) / totalCustomers : 0;
      
      console.log('✅ Customer Data Available');
      console.log(`   Total Customers: ${totalCustomers}`);
      console.log(`   Active Customers: ${activeCustomers}`);
      console.log(`   New Customers (Last 30 days): ${newCustomers}`);
      console.log(`   Total Revenue: ₹${totalRevenue.toFixed(2)}`);
      console.log(`   Avg Orders per Customer: ${averageOrdersPerCustomer.toFixed(2)}`);
      
      if (users.length > 0) {
        console.log('\n   Sample Customers:');
        users.slice(0, 3).forEach((u, i) => {
          console.log(`   ${i + 1}. ${u.name} - Orders: ${u.totalOrders} - Spent: ₹${u.totalSpent || 0}`);
        });
      }
      
    } catch (err) {
      console.log('❌ Customer Data Error:', err.message);
      console.log('   Stack:', err.stack);
    }
    console.log('');
    
    console.log('=' .repeat(70));
    console.log('✅ TESTING COMPLETE\n');
    
    console.log('📋 NEXT STEPS TO DEBUG:');
    console.log('   1. Check backend server console for errors');
    console.log('   2. Check browser console (F12) for errors');
    console.log('   3. Check Network tab for failed requests');
    console.log('   4. Verify endpoints in routes file');
    console.log('   5. Test endpoints directly with curl or Postman\n');
    
    console.log('🔧 TEST ENDPOINTS MANUALLY:');
    console.log('   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:50004/api/admin/reports/stock');
    console.log('   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:50004/api/admin/reports/customers\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error('Stack:', error.stack);
    await mongoose.disconnect();
  }
};

testStockAndCustomerReports();
