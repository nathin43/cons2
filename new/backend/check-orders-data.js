const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');
const Product = require('./models/Product');
require('dotenv').config();

const checkOrdersData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check total orders
    const totalOrders = await Order.countDocuments();
    console.log(`📊 Total Orders in Database: ${totalOrders}\n`);

    if (totalOrders === 0) {
      console.log('⚠️  NO ORDERS FOUND IN DATABASE');
      console.log('This is why sales, payment, and order reports are empty.\n');
      
      // Check if there are users and products
      const userCount = await User.countDocuments();
      const productCount = await Product.countDocuments();
      
      console.log(`👥 Total Users: ${userCount}`);
      console.log(`📦 Total Products: ${productCount}\n`);
      
      if (userCount > 0 && productCount > 0) {
        console.log('💡 SOLUTION: You need to create sample orders for testing');
        console.log('   Run: node seed-sample-orders.js');
      } else {
        console.log('⚠️  Please create users and products first before seeding orders.');
      }
    } else {
      // Show sample orders
      const orders = await Order.find({})
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(10);

      console.log('📦 Sample Orders:\n');
      orders.forEach((order, index) => {
        console.log(`${index + 1}. Order #${order.orderNumber || order._id.toString().slice(-6)}`);
        console.log(`   Customer: ${order.user?.name || 'N/A'}`);
        console.log(`   Status: ${order.orderStatus || order.status}`);
        console.log(`   Total: ₹${order.totalAmount || order.totalPrice || 0}`);
        console.log(`   Payment: ${order.paymentMethod || 'N/A'}`);
        console.log(`   Date: ${order.createdAt.toLocaleDateString()}\n`);
      });

      // Order statistics
      const stats = await Order.aggregate([
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 },
            totalAmount: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } }
          }
        }
      ]);

      console.log('📊 Order Statistics:');
      stats.forEach(stat => {
        console.log(`   ${stat._id || 'No Status'}: ${stat.count} orders, ₹${stat.totalAmount.toFixed(2)}`);
      });

      // Payment method breakdown
      const paymentStats = await Order.aggregate([
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 }
          }
        }
      ]);

      console.log('\n💳 Payment Methods:');
      paymentStats.forEach(stat => {
        console.log(`   ${stat._id || 'Unknown'}: ${stat.count} orders`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Check completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkOrdersData();
