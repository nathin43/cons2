const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Order = require('./models/Order');
const Product = require('./models/Product');

/**
 * Test getUserFullReport data for specific user
 */
async function testUserReport() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the user from the screenshot (sadha with orders)
    const userId = '696dd60a9a016f1a7d0d2699'; // From the URL in screenshot
    
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log(`=== User: ${user.name} (${user.email}) ===\n`);

    // Fetch orders the same way the controller does
    const orders = await Order.find({ user: userId })
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 });

    console.log(`Total Orders: ${orders.length}\n`);

    console.log('=== Order Details ===');
    orders.forEach((order, index) => {
      console.log(`\nOrder ${index + 1}:`);
      console.log(`  ID: ${order._id}`);
      console.log(`  Order Number: ${order.orderNumber}`);
      console.log(`  Status: ${order.orderStatus}`);
      console.log(`  Total Amount: ₹${order.totalAmount}`);
      console.log(`  Payment Status: ${order.paymentStatus}`);
      console.log(`  Items: ${order.items.length}`);
      console.log(`  Created: ${order.createdAt.toLocaleDateString()}`);
    });

    // Calculate summary (same as controller)
    const deliveredOrders = orders.filter(o => o.orderStatus === 'delivered');
    const totalSpent = deliveredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    console.log('\n=== Summary (as returned by API) ===');
    console.log(`Total Orders: ${orders.length}`);
    console.log(`Delivered Orders: ${deliveredOrders.length}`);
    console.log(`Total Spent (on delivered): ₹${totalSpent}`);
    console.log(`Pending Orders: ${orders.filter(o => o.orderStatus === 'pending').length}`);
    console.log(`Cancelled Orders: ${orders.filter(o => o.orderStatus === 'cancelled').length}`);

    console.log('\n✅ Test completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testUserReport();
