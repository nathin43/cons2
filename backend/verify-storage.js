const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Admin = require('./models/Admin');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Contact = require('./models/Contact');

dotenv.config();

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!uri) {
  console.error('Missing MONGO_URI (or MONGODB_URI).');
  process.exit(1);
}

function missingExpr(fieldPath, kind = 'string') {
  const base = [{ [fieldPath]: { $exists: false } }, { [fieldPath]: null }];

  if (kind === 'string') {
    base.push({ [fieldPath]: '' });
  }

  if (kind === 'array') {
    base.push({ [fieldPath]: { $size: 0 } });
  }

  return { $or: base };
}

async function checkCollection(label, Model, requiredFields) {
  const total = await Model.countDocuments();
  const missing = {};

  for (const fieldConfig of requiredFields) {
    const field = typeof fieldConfig === 'string' ? fieldConfig : fieldConfig.name;
    const kind = typeof fieldConfig === 'string' ? 'string' : fieldConfig.kind || 'string';
    missing[field] = await Model.countDocuments(missingExpr(field, kind));
  }

  return { label, total, missing };
}

(async () => {
  try {
    await mongoose.connect(uri);

    const checks = await Promise.all([
      checkCollection('admins', Admin, ['name', 'email', 'role', 'status']),
      checkCollection('users', User, ['name', 'email', 'phone', 'status']),
      checkCollection('products', Product, ['name', 'description', 'price', 'category', 'brand', 'image', 'stock']),
      checkCollection('orders', Order, [
        { name: 'user', kind: 'objectId' },
        { name: 'items', kind: 'array' },
        'totalAmount',
        'orderStatus',
        'paymentStatus'
      ]),
      checkCollection('contacts', Contact, ['name', 'email', 'phone', 'message', 'inquiryType'])
    ]);

    let hasIssues = false;
    console.log('\nStorage verification summary:\n');

    for (const result of checks) {
      console.log(`- ${result.label}: total=${result.total}`);
      for (const [field, count] of Object.entries(result.missing)) {
        if (count > 0) {
          hasIssues = true;
          console.log(`  missing ${field}: ${count}`);
        }
      }
    }

    if (hasIssues) {
      console.log('\nVerification completed with missing required-field values.');
      process.exitCode = 1;
    } else {
      console.log('\nVerification completed: required fields are present in checked collections.');
      process.exitCode = 0;
    }
  } catch (error) {
    console.error('verify-storage failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
