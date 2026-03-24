const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const Admin = require('./models/Admin');
const Order = require('./models/Order');

dotenv.config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

(async () => {
  try {
    await mongoose.connect(uri);

    const adminResult = await Admin.updateMany(
      {
        $or: [
          { status: { $exists: false } },
          { status: null },
          { status: '' }
        ]
      },
      {
        $set: { status: 'Active' }
      }
    );

    const orders = await Order.find({
      $or: [{ totalAmount: { $exists: false } }, { totalAmount: null }]
    });

    let orderFixCount = 0;
    for (const order of orders) {
      const subtotal = Number(order.subtotal || 0);
      const gst = Number(order.gst || 0);
      const shipping = Number(order.shipping || 0);
      order.totalAmount = Number((subtotal + gst + shipping).toFixed(2));
      await order.save();
      orderFixCount += 1;
    }

    console.log(
      JSON.stringify({
        adminsStatusFixed: adminResult.modifiedCount,
        ordersTotalAmountFixed: orderFixCount
      })
    );
  } catch (error) {
    console.error('backfill-required-fields failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
