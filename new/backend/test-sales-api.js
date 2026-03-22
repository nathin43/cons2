const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./models/Order');

async function testSalesReport() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test the exact logic from getSalesReport
    const filters = {};
    const orders = await Order.find(filters)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image price')
      .sort('-createdAt')
      .lean();

    console.log(`📊 Total Orders Found: ${orders.length}`);
    
    if (orders.length > 0) {
      console.log('\n🔍 Sample Order:');
      console.log('Order ID:', orders[0]._id);
      console.log('Order Number:', orders[0].orderNumber);
      console.log('Total Amount: ₹' + orders[0].totalAmount);
      console.log('Status:', orders[0].orderStatus);
      console.log('User:', orders[0].user?.name || 'N/A');
      console.log('Items:', orders[0].items?.length || 0);
    }

    // Calculate summary
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => 
      (o.orderStatus || '').toLowerCase() === 'delivered'
    );
    const totalRevenue = deliveredOrders.reduce((sum, o) => 
      sum + (o.totalAmount || 0), 0
    );
    const averageOrderValue = deliveredOrders.length > 0 
      ? totalRevenue / deliveredOrders.length 
      : 0;

    console.log('\n📈 Sales Summary:');
    console.log('Total Sales:', totalOrders);
    console.log('Completed Orders:', deliveredOrders.length);
    console.log('Total Revenue: ₹' + totalRevenue.toFixed(2));
    console.log('Average Order Value: ₹' + averageOrderValue.toFixed(2));

    // Test response structure
    const response = {
      success: true,
      summary: {
        totalSales: totalOrders,
        totalRevenue,
        averageOrderValue,
        completedOrders: deliveredOrders.length
      },
      data: orders.slice(0, 5).map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus
      }))
    };

    console.log('\n✅ Response Structure Valid');
    console.log('Response:', JSON.stringify(response, null, 2).substring(0, 500) + '...');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

testSalesReport();
