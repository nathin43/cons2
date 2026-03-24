/**
 * Startup Validation Script
 * Checks all required environment variables and dependencies before starting
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('\n🔍 Running Startup Validation...\n');

let errors = [];
let warnings = [];

// Check environment variables
const requiredEnv = [
  'JWT_SECRET',
  'PORT'
];

const optionalEnv = [
  'NODE_ENV',
  'EMAIL_SERVICE',
  'EMAIL_USER',
  'EMAIL_PASS',
  'GOOGLE_CLIENT_ID'
];

console.log('📋 Checking Environment Variables...');
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
  errors.push('❌ Missing required: MONGO_URI (or legacy MONGODB_URI)');
} else {
  console.log('✅ MONGO_URI is set');
}

requiredEnv.forEach(env => {
  if (!process.env[env]) {
    errors.push(`❌ Missing required: ${env}`);
  } else {
    console.log(`✅ ${env} is set`);
  }
});

optionalEnv.forEach(env => {
  if (!process.env[env]) {
    warnings.push(`⚠️  Optional ${env} not set - some features may not work`);
  }
});

// Check MongoDB URI format
if (mongoUri) {
  if (!mongoUri.includes('mongodb')) {
    errors.push('❌ MONGO_URI does not look valid (should contain "mongodb")');
  } else if (mongoUri.includes('YOUR_NEW_PASSWORD') || 
             mongoUri.includes('YOUR_PASSWORD') ||
             mongoUri.includes('CHANGE_THIS') ||
             mongoUri.includes('REPLACE_THIS')) {
    errors.push('❌ MONGO_URI contains placeholder password! Update .env with your actual MongoDB password');
    errors.push('   📝 Instructions: Go to MongoDB Atlas → Database Access → Edit User → Reset Password');
  } else {
    console.log('✅ MONGO_URI format looks valid');
  }
}

// Check if required dependencies are installed
console.log('\n📦 Checking Dependencies...');
const requiredPackages = ['express', 'mongoose', 'cors', 'dotenv'];
const packageJson = require('./package.json');

requiredPackages.forEach(pkg => {
  if (packageJson.dependencies[pkg] || packageJson.devDependencies[pkg]) {
    console.log(`✅ ${pkg} is installed`);
  } else {
    errors.push(`❌ Missing dependency: ${pkg}`);
  }
});

// Check if uploads directory exists
console.log('\n📁 Checking Directories...');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('⚠️  Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Uploads directory created');
} else {
  console.log('✅ Uploads directory exists');
}

// Summary
console.log('\n' + '='.repeat(50));
if (errors.length > 0) {
  console.log('\n❌ CRITICAL ERRORS FOUND:\n');
  errors.forEach(err => console.log(err));
  console.log('\n⛔ CANNOT START SERVER - Fix errors above\n');
  process.exit(1);
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:\n');
  warnings.forEach(warn => console.log(warn));
  console.log('\n✅ Server can start, but some features may be limited\n');
}

console.log('✨ All validations passed! Ready to start server.\n');
console.log('='.repeat(50) + '\n');

process.exit(0);
