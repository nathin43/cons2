/**
 * Migration Script: Update User Status Field
 * 
 * This script updates all existing users to have a proper status field.
 * - Sets status to "ACTIVE" for users with no status or null/undefined status
 * - Ensures all users have a valid status: ACTIVE, BLOCKED, or SUSPENDED
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const migrateUserStatus = async () => {
  try {
    console.log('🔄 Starting User Status Migration...\n');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Find all users
    const allUsers = await User.find({});
    console.log(`📊 Found ${allUsers.length} total users\n`);

    // Count users by current status
    const usersWithoutStatus = await User.countDocuments({ 
      $or: [
        { status: { $exists: false } },
        { status: null },
        { status: '' }
      ]
    });
    
    const usersWithStatus = await User.countDocuments({ 
      status: { $in: ['ACTIVE', 'BLOCKED', 'SUSPENDED'] }
    });

    console.log(`📈 Current Status Distribution:`);
    console.log(`   - Users without status: ${usersWithoutStatus}`);
    console.log(`   - Users with valid status: ${usersWithStatus}\n`);

    // Update users without status or with invalid status
    const updateResult = await User.updateMany(
      {
        $or: [
          { status: { $exists: false } },
          { status: null },
          { status: '' },
          { status: { $nin: ['ACTIVE', 'BLOCKED', 'SUSPENDED', 'INACTIVE'] } }
        ]
      },
      {
        $set: { 
          status: 'ACTIVE',
          statusChangedAt: new Date(),
          statusChangedBy: 'migration-script',
          lastLoginAt: new Date()
        }
      }
    );

    console.log(`✨ Migration Results:`);
    console.log(`   - Matched documents: ${updateResult.matchedCount}`);
    console.log(`   - Modified documents: ${updateResult.modifiedCount}\n`);

    // Verify migration
    const verifyActive = await User.countDocuments({ status: 'ACTIVE' });
    const verifyBlocked = await User.countDocuments({ status: 'BLOCKED' });
    const verifySuspended = await User.countDocuments({ status: 'SUSPENDED' });
    const verifyInactive = await User.countDocuments({ status: 'INACTIVE' });
    const verifyInvalid = await User.countDocuments({ 
      $or: [
        { status: { $exists: false } },
        { status: null },
        { status: '' },
        { status: { $nin: ['ACTIVE', 'BLOCKED', 'SUSPENDED', 'INACTIVE'] } }
      ]
    });

    console.log(`✅ Post-Migration Status Distribution:`);
    console.log(`   - ACTIVE users: ${verifyActive}`);
    console.log(`   - BLOCKED users: ${verifyBlocked}`);
    console.log(`   - SUSPENDED users: ${verifySuspended}`);
    console.log(`   - INACTIVE users: ${verifyInactive}`);
    console.log(`   - Users with invalid status: ${verifyInvalid}\n`);

    if (verifyInvalid === 0) {
      console.log('🎉 Migration completed successfully! All users have valid status.');
    } else {
      console.log('⚠️  Warning: Some users still have invalid status. Please check.');
    }

    // Show sample users
    console.log('\n📋 Sample of migrated users:');
    const sampleUsers = await User.find({}).limit(5).select('name email status statusChangedAt lastLoginAt');
    sampleUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - Status: ${user.status}, Last Login: ${user.lastLoginAt?.toDateString() || 'N/A'}`);
    });

    console.log('\n✅ Migration script completed!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run migration
migrateUserStatus();
