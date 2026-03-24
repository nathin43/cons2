const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');

dotenv.config();

/**
 * Seed script to create MAIN_ADMIN account
 * MAIN_ADMIN Email: manielectricals@gmail.com
 * MAIN_ADMIN Password: Mani1234
 */
const seedMainAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    const mainAdminEmail = 'manielectricals@gmail.com';
    const mainAdminPassword = 'Mani1234';

    // Check if MAIN_ADMIN already exists
    let mainAdmin = await Admin.findOne({ email: mainAdminEmail });

    if (mainAdmin) {
      console.log(`✅ MAIN_ADMIN already exists: ${mainAdminEmail}`);
      // Update role if necessary
      if (mainAdmin.role !== 'MAIN_ADMIN') {
        mainAdmin.role = 'MAIN_ADMIN';
        await mainAdmin.save();
        console.log(`✅ Updated ${mainAdminEmail} role to MAIN_ADMIN`);
      }
    } else {
      // Create new MAIN_ADMIN
      mainAdmin = new Admin({
        name: 'Mani Electrical Admin',
        email: mainAdminEmail,
        password: mainAdminPassword,
        role: 'MAIN_ADMIN',
        status: 'Active'
      });

      await mainAdmin.save();
      console.log(`✅ MAIN_ADMIN created successfully`);
      console.log(`   Email: ${mainAdminEmail}`);
      console.log(`   Password: ${mainAdminPassword}`);
      console.log(`   Role: MAIN_ADMIN`);
    }

    // Ensure all other admins are SUB_ADMIN
    const subAdminResult = await Admin.updateMany(
      { email: { $ne: mainAdminEmail } },
      { role: 'SUB_ADMIN' }
    );

    if (subAdminResult.modifiedCount > 0) {
      console.log(`✅ Updated ${subAdminResult.modifiedCount} admin(s) to SUB_ADMIN`);
    }

    // List all admins
    const allAdmins = await Admin.find().select('name email role status');
    console.log('\n📋 All Admins in System:');
    allAdmins.forEach(admin => {
      const indicator = admin.email === mainAdminEmail ? '👑' : '👤';
      console.log(`  ${indicator} ${admin.name} (${admin.email}): ${admin.role} [${admin.status}]`);
    });

    console.log('\n✅ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedMainAdmin();
