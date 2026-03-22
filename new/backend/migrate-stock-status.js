/**
 * One-time migration: back-fill three-tier stock status for all existing products.
 * Run: node backend/migrate-stock-status.js
 */
require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connected');

  const [oos, ls, act] = await Promise.all([
    // stock = 0  AND not manually inactive  → out-of-stock
    Product.updateMany(
      { stock: 0, status: { $ne: 'inactive' } },
      { $set: { status: 'out-of-stock' } }
    ),
    // stock 1–10 AND not manually inactive  → low-stock
    Product.updateMany(
      { stock: { $gt: 0, $lte: 10 }, status: { $ne: 'inactive' } },
      { $set: { status: 'low-stock' } }
    ),
    // stock > 10 AND was auto-set to oos/low-stock  → restore active
    Product.updateMany(
      { stock: { $gt: 10 }, status: { $in: ['out-of-stock', 'low-stock'] } },
      { $set: { status: 'active' } }
    ),
  ]);

  console.log(`  ✔ out-of-stock set:  ${oos.modifiedCount}`);
  console.log(`  ✔ low-stock set:     ${ls.modifiedCount}`);
  console.log(`  ✔ active restored:   ${act.modifiedCount}`);
  console.log('\n✅ Migration complete');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('❌ Migration error:', err.message);
  process.exit(1);
});
