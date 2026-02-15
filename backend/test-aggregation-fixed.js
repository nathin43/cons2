const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Order = require('./models/Order');

/**
 * Test if Admin Reports data shows correctly after migration
 */
async function testReportData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get users who have orders console.log('=== Testing aggregation for users with orders ===\n');
    
    const usersWithOrders = await Order.distinct('user');
    console.log(`Found ${usersWithOrders.length} users with orders\n`);

    for (const userId of usersWithOrders) {
      const user = await User.findById(userId);
      
      if (!user) {
        console.log(`⚠️ User ${userId} not found\n`);
        continue;
      }

      // Manual calculation
      const userOrders = await Order.find({ user: userId });
      const deliveredOrders = userOrders.filter(o => o.orderStatus === 'delivered');
      const totalAmount = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const lastOrderDate = userOrders.length > 0 
        ? new Date(Math.max(...userOrders.map(o => new Date(o.createdAt)))) 
        : null;

      // Aggregation calculation
      const [aggregationResult] = await User.aggregate([
        { $match: { _id: userId } },
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
            totalAmountSpent: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$orders',
                      as: 'order',
                      cond: { 
                        $eq: [
                          { $toLower: { $ifNull: ['$$order.orderStatus', ''] } },
                          'delivered'
                        ]
                      }
                    }
                  },
                  as: 'order',
                  in: { $ifNull: ['$$order.totalAmount', 0] }
                }
              }
            },
            lastOrder: { $max: '$orders.createdAt' }
          }
        }
      ]);

      console.log(`User: ${user.name} (${user.email})`);
      console.log(`  Total Orders: ${userOrders.length}`);
      console.log(`  Delivered Orders: ${deliveredOrders.length}`);
      console.log(`  Manual Calculation: ₹${totalAmount}`);
      console.log(`  Aggregation Result: ₹${aggregationResult.totalAmountSpent}`);
      console.log(`  Last Order (Manual): ${lastOrderDate ? lastOrderDate.toLocaleDateString() : 'N/A'}`);
      console.log(`  Last Order (Aggregation): ${aggregationResult.lastOrder ? new Date(aggregationResult.lastOrder).toLocaleDateString() : 'N/A'}`);
      console.log(`  ${aggregationResult.totalAmountSpent === totalAmount ? '✅ MATCH' : '❌ MISMATCH'}\n`);
    }

    console.log('✅ Test completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testReportData();
