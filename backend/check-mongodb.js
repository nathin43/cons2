#!/usr/bin/env node

/**
 * MongoDB Atlas IP Whitelist Checker
 * 
 * This script helps diagnose if your IP is whitelisted in MongoDB Atlas
 * Run: node check-mongodb.js
 */

const https = require('https');

console.log('\n🔍 MongoDB Connection Diagnostics\n');
console.log('━'.repeat(50));

// Get public IP
function getPublicIP() {
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data.trim()));
    }).on('error', reject);
  });
}

// Test MongoDB connection
function testMongoDB() {
  const mongoose = require('mongoose');
  require('dotenv').config();

  return new Promise((resolve) => {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      resolve({
        success: false,
        message: '❌ MONGODB_URI not found in .env file'
      });
      return;
    }

    mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000
    })
      .then(conn => {
        mongoose.disconnect();
        resolve({
          success: true,
          message: '✅ MongoDB connection successful!',
          details: `Connected to: ${conn.connection.host}`
        });
      })
      .catch(error => {
        let message = error.message;
        let suggestion = '';

        if (message.includes('Could not connect to any servers')) {
          suggestion = '💡 Your IP might not be whitelisted in MongoDB Atlas';
        } else if (message.includes('authentication failed')) {
          suggestion = '💡 Check your MongoDB credentials in .env file';
        } else if (message.includes('ENOTFOUND')) {
          suggestion = '💡 Check your internet connection';
        }

        resolve({
          success: false,
          message: `❌ ${message}`,
          suggestion
        });
      });
  });
}

// Main function
(async () => {
  try {
    const ip = await getPublicIP();
    console.log(`\n📍 Your Public IP: ${ip}\n`);
    console.log('Checking MongoDB connection...\n');

    const result = await testMongoDB();
    
    console.log(result.message);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
    if (result.suggestion) {
      console.log(`\n${result.suggestion}`);
      console.log('\n📋 To whitelist your IP in MongoDB Atlas:');
      console.log('1. Go to https://cloud.mongodb.com/');
      console.log('2. Select your cluster');
      console.log('3. Go to Security → Network Access');
      console.log('4. Click "+ Add IP Address"');
      console.log(`5. Enter: ${ip}`);
      console.log('6. Click "Confirm"');
      console.log('7. Wait 1-2 minutes and restart your backend server');
    }

    console.log('\n' + '━'.repeat(50) + '\n');
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Diagnostic error:', error.message);
    console.log('\n' + '━'.repeat(50) + '\n');
    process.exit(1);
  }
})();
