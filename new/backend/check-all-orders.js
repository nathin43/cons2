const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./models/Order');
const User = require('./models/User');

async function checkOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get total count of orders
    const totalOrders = await Order.countDocuments();
    console.log(`=== Total Orders in Database: ${totalOrders} ===\n`);

    if (totalOrders === 0) {
      console.log('❌ No orders found in database!');
      process.exit(0);
    }

    // Get sample orders with user info
    const sampleOrders = await Order.find().limit(5).populate('user', 'name email');
    
    console.log('=== Sample Orders (first 5) ===');
    sampleOrders.forEach((order, index) => {
      console.log(`\nOrder ${index + 1}:`);
      console.log(`  Order ID: ${order._id}`);
      console.log(`  User Field Type: ${typeof order.user}`);
      console.log(`  User Field Value: ${order.user}`);
      console.log(`  Order Status: ${order.orderStatus}`);
      console.log(`  Total Amount: ₹${order.totalAmount}`);
      console.log(`  Created At: ${order.createdAt}`);
      
      if (order.populated('user')) {
        console.log(`  User Info: ${order.user?.name} (${order.user?.email})`);
      }
    });

    // Get all distinct order statuses
    const statuses = await Order.distinct('orderStatus');
    console.log(`\n=== Order Statuses in Database ===`);
    console.log(statuses);

    // Count by status
    console.log(`\n=== Order Count by Status ===`);
    for (const status of statuses) {
      const count = await Order.countDocuments({ orderStatus: status });
      console.log(`  ${status}: ${count} orders`);
    }

    // Check total users
    const totalUsers = await User.countDocuments();
    console.log(`\n=== Total Users: ${totalUsers} ===`);

    // Find users with orders
    const usersWithOrders = await Order.distinct('user');
    console.log(`\n=== Users with Orders: ${usersWithOrders.length} ===`);

    console.log('\n✅ Check completed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkOrders();
