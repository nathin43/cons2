/**
 * Database Cleanup & Audit Script
 * ================================
 * Lists all collections, identifies which are required vs unnecessary,
 * and optionally drops the unused ones.
 *
 * Usage:
 *   DRY RUN (default, shows what would be removed):
 *     node db-cleanup.js
 *
 *   ACTUALLY DROP unused collections:
 *     node db-cleanup.js --drop
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Collections the application needs (matches model files)
const REQUIRED_COLLECTIONS = new Set([
  'users',
  'admins',
  'products',
  'orders',
  'carts',
  'contacts',
  'notifications',
  'returns',
  'reviews',
  'services',
  'reports',
  'reportmessages',
  'generated_reports',
  'payments',
  'sales_reports',
  'activity_logs',
]);

// MongoDB internal collections that must never be touched
const SYSTEM_COLLECTIONS = new Set([
  'system.profile',
  'system.views',
]);

async function run() {
  const doDrop = process.argv.includes('--drop');

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI not found in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB\n');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);

  console.log('═══════════════════════════════════════════');
  console.log('  DATABASE COLLECTION AUDIT');
  console.log('═══════════════════════════════════════════\n');

  // Classify collections
  const kept = [];
  const unused = [];
  const system = [];

  for (const name of collectionNames.sort()) {
    if (SYSTEM_COLLECTIONS.has(name)) {
      system.push(name);
    } else if (REQUIRED_COLLECTIONS.has(name)) {
      kept.push(name);
    } else {
      unused.push(name);
    }
  }

  // Print required collections
  console.log(`✅ REQUIRED COLLECTIONS (${kept.length}):`);
  for (const name of kept) {
    const count = await db.collection(name).countDocuments();
    console.log(`   ✔ ${name.padEnd(22)} ${count} documents`);
  }

  // Print missing collections (defined in models but don't exist yet)
  const missing = [...REQUIRED_COLLECTIONS].filter(c => !collectionNames.includes(c));
  if (missing.length > 0) {
    console.log(`\n📦 MISSING COLLECTIONS (${missing.length}) — will be auto-created on first write:`);
    for (const name of missing) {
      console.log(`   ➕ ${name}`);
    }
  }

  // Print unused collections
  if (unused.length > 0) {
    console.log(`\n🗑️  UNUSED COLLECTIONS (${unused.length}) — safe to remove:`);
    for (const name of unused) {
      const count = await db.collection(name).countDocuments();
      console.log(`   ✕ ${name.padEnd(22)} ${count} documents`);
    }
  } else {
    console.log('\n🎉 No unused collections found — database is clean!');
  }

  // Drop unused if --drop flag
  if (doDrop && unused.length > 0) {
    console.log('\n⚠️  DROPPING unused collections...\n');
    for (const name of unused) {
      try {
        await db.collection(name).drop();
        console.log(`   ✅ Dropped: ${name}`);
      } catch (err) {
        console.log(`   ❌ Failed to drop ${name}: ${err.message}`);
      }
    }
    console.log('\n✅ Cleanup complete!');
  } else if (unused.length > 0) {
    console.log('\n💡 Run with --drop flag to remove unused collections:');
    console.log('   node db-cleanup.js --drop\n');
  }

  // Print final summary
  console.log('\n═══════════════════════════════════════════');
  console.log('  FINAL COLLECTION STRUCTURE');
  console.log('═══════════════════════════════════════════\n');

  const finalCollections = [
    { name: 'users',             purpose: 'Customer accounts & login' },
    { name: 'admins',            purpose: 'Admin accounts & RBAC roles' },
    { name: 'products',          purpose: 'Product catalog (name, price, stock, images)' },
    { name: 'orders',            purpose: 'Customer orders & shipping details' },
    { name: 'payments',          purpose: 'Payment transactions (Razorpay, COD, UPI)' },
    { name: 'carts',             purpose: 'Customer shopping carts' },
    { name: 'contacts',          purpose: 'Contact form / support messages' },
    { name: 'notifications',     purpose: 'Admin event notifications' },
    { name: 'returns',           purpose: 'Return & refund requests' },
    { name: 'reviews',           purpose: 'Product ratings & reviews' },
    { name: 'services',          purpose: 'Electrical services offered' },
    { name: 'reports',           purpose: 'Per-order report records' },
    { name: 'reportmessages',    purpose: 'Admin-to-user inbox messages' },
    { name: 'generated_reports', purpose: 'Aggregated report snapshots (TTL 30d)' },
    { name: 'sales_reports',     purpose: 'Daily/weekly/monthly sales analytics' },
    { name: 'activity_logs',     purpose: 'Admin action audit trail' },
  ];

  for (const c of finalCollections) {
    const exists = collectionNames.includes(c.name) ? '✔' : '➕';
    console.log(`   ${exists} ${c.name.padEnd(22)} — ${c.purpose}`);
  }

  console.log('\n═══════════════════════════════════════════');
  console.log(`  Total: ${REQUIRED_COLLECTIONS.size} collections`);
  console.log('═══════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

run().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
