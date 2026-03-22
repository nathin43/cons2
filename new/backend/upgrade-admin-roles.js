const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');

dotenv.config();

/**
 * Script to upgrade existing admin accounts to MAIN_ADMIN
 * Run this once to ensure main admin has correct role
 */
const upgradeAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Update all admins with old roles to MAIN_ADMIN
    const result = await Admin.updateMany(
      { role: { $nin: ['MAIN_ADMIN', 'SUB_ADMIN'] } },
      { role: 'MAIN_ADMIN' },
      { runValidators: true }
    );

    console.log(`✅ Updated ${result.modifiedCount} admin(s) to MAIN_ADMIN`);

    // List all admins
    const admins = await Admin.find().select('name email role status');
    console.log('\n📋 Current Admins:');
    admins.forEach(admin => {
      console.log(`  - ${admin.name} (${admin.email}): ${admin.role} [${admin.status}]`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

upgradeAdmins();
