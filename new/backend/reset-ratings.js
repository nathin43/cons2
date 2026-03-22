/**
 * reset-ratings.js
 * Resets all product ratings to { average: 0, count: 0 }
 * Run: node reset-ratings.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function resetRatings() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await Product.updateMany(
      {},
      { $set: { 'ratings.average': 0, 'ratings.count': 0 } }
    );
    console.log(`✅ Reset ratings on ${result.modifiedCount} products`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

resetRatings();
