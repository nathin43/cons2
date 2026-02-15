/**
 * Script to fix E11000 duplicate key error for googleId
 * Run this once to drop the problematic index
 */

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/electric-shop');
    console.log('✓ MongoDB connected');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const fixDuplicateKeyError = async () => {
  try {
    console.log('\nDropping problematic indexes...');
    
    // Drop the old unique index on googleId
    try {
      await User.collection.dropIndex('googleId_1');
      console.log('✓ Dropped old googleId_1 index');
    } catch (err) {
      if (err.message.includes('index not found')) {
        console.log('✓ googleId_1 index already removed');
      } else {
        throw err;
      }
    }

    // Recreate the correct sparse index
    console.log('\nCreating correct sparse index...');
    await User.collection.createIndex({ googleId: 1 }, { unique: true, sparse: true });
    console.log('✓ Created correct sparse index on googleId');

    console.log('\n✓ Fix completed successfully!');
    console.log('You can now register users without googleId without getting duplicate key errors.');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

const main = async () => {
  await connectDB();
  await fixDuplicateKeyError();
};

main();
