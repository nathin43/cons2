#!/usr/bin/env node

/**
 * MongoDB Connection Tester
 * Run: node test-connection.js
 * 
 * This script tests if MongoDB Atlas connection is working
 */

require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  console.log('\n🔍 Testing MongoDB Atlas Connection...\n');
  console.log('📋 Connection Details:');
  console.log(`- URI: ${process.env.MONGODB_URI.split('@')[0]}...@${process.env.MONGODB_URI.split('@')[1].split('/')[0]}`);
  console.log(`- Database: electric-shop`);
  console.log(`- Environment: ${process.env.NODE_ENV}\n`);

  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      connectTimeoutMS: 10000,
    });

    console.log('\n✅ SUCCESS! MongoDB connection is working!\n');
    console.log('📊 Connection Info:');
    console.log(`- Host: ${conn.connection.host}`);
    console.log(`- Database: ${conn.connection.name}`);
    console.log(`- State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log('\n✨ You can now start the backend server with: npm run dev\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.log('\n❌ CONNECTION FAILED!\n');
    console.log('❌ Error:', error.message);
    console.log('\n⚠️  SOLUTION:\n');
    console.log('1. Go to: https://cloud.mongodb.com/v2/');
    console.log('2. Click on Cluster0');
    console.log('3. Go to: Security → Network Access');
    console.log('4. Click "+ Add IP Address"');
    console.log('5. Enter: 0.0.0.0/0 (for development) or your IP address');
    console.log('6. Click "Confirm"');
    console.log('7. Wait 2-3 minutes for the change to apply');
    console.log('8. Run this test again: node test-connection.js\n');

    process.exit(1);
  }
};

testConnection();
