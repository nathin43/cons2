const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./models/Order');

/**
 * Migration Script: Fix Order Data Issues
 * 
 * This script:
 * 1. Normalizes orderStatus to lowercase (Delivered -> delivered, Confirmed -> confirmed, etc.)
 * 2. Recalculates totalAmount from order items for orders with ₹0
 */
async function fixOrderTotalAmounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // STEP 1: Normalize order statuses to lowercase
    console.log('=== Step 1: Normalizing Order Statuses ===\n');
    
    const allOrders = await Order.find({});
    let statusFixedCount = 0;
    
    for (const order of allOrders) {
      const originalStatus = order.orderStatus;
      const normalizedStatus = originalStatus.toLowerCase();
      
      if (originalStatus !== normalizedStatus) {
        // Use updateOne to bypass validation temporarily
        await Order.updateOne(
          { _id: order._id },
          { $set: { orderStatus: normalizedStatus } }
        );
        console.log(`✅ Normalized: ${originalStatus} → ${normalizedStatus} (Order ${order._id})`);
        statusFixedCount++;
      }
    }
    
    console.log(`\n✅ Normalized ${statusFixedCount} order statuses\n`);

    // STEP 2: Fix orders with totalAmount = 0
    console.log('=== Step 2: Fixing Order Total Amounts ===\n');
    
    const ordersWithZeroAmount = await Order.find({ totalAmount: 0 });
    
    console.log(`Found ${ordersWithZeroAmount.length} orders with totalAmount = ₹0`);
    
    if (ordersWithZeroAmount.length === 0) {
      console.log('✅ No orders need amount fixing!');
    } else {
      let fixedCount = 0;
      let skippedCount = 0;

      for (const order of ordersWithZeroAmount) {
        // Calculate total from items
        let calculatedTotal = 0;
        
        if (order.items && order.items.length > 0) {
          for (const item of order.items) {
            const itemTotal = (item.price || 0) * (item.quantity || 0);
            calculatedTotal += itemTotal;
          }
        }

        if (calculatedTotal > 0) {
          // Update the order
          order.totalAmount = calculatedTotal;
          await order.save();
          
          console.log(`✅ Fixed Order ${order._id}`);
          console.log(`   Old Amount: ₹0`);
          console.log(`   New Amount: ₹${calculatedTotal}`);
          console.log(`   Items: ${order.items.length}`);
          console.log(`   Status: ${order.orderStatus}`);
          console.log('');
          
          fixedCount++;
        } else {
          console.log(`⚠️ Skipped Order ${order._id} - no items with valid prices`);
          skippedCount++;
        }
      }

      console.log('\n=== Amount Fix Summary ===');
      console.log(`Total Orders Processed: ${ordersWithZeroAmount.length}`);
      console.log(`✅ Fixed: ${fixedCount}`);
      console.log(`⚠️ Skipped: ${skippedCount}\n`);
    }
    // Show updated statistics
    console.log('\n=== Updated Database Statistics ===');
    
    const totalOrders = await Order.countDocuments();
    const ordersWithAmount = await Order.countDocuments({ totalAmount: { $gt: 0 } });
    const ordersStillZero = await Order.countDocuments({ totalAmount: 0 });
    
    const statuses = await Order.distinct('orderStatus');
    
    console.log(`Total Orders: ${totalOrders}`);
    console.log(`Orders with Amount > ₹0: ${ordersWithAmount}`);
    console.log(`Orders still at ₹0: ${ordersStillZero}`);
    console.log('\nOrder Statuses:');
    
    for (const status of statuses) {
      const count = await Order.countDocuments({ orderStatus: status });
      const totalAmount = await Order.aggregate([
        { $match: { orderStatus: status } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      const sum = totalAmount[0]?.total || 0;
      console.log(`  ${status}: ${count} orders, Total: ₹${sum}`);
    }
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

fixOrderTotalAmounts();
