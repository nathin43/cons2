const mongoose = require('mongoose');
const User = require('./models/User');
const Admin = require('./models/Admin');
const ReportMessage = require('./models/ReportMessage');
require('dotenv').config();

/**
 * Seed Report Messages for Testing
 * Creates sample report messages for users
 */
const seedReportMessages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get a sample user
    const user = await User.findOne({ email: 'mrsolking676@gmail.com' });
    if (!user) {
      console.log('❌ User not found. Please check email.');
      await mongoose.disconnect();
      return;
    }

    // Get an admin (required field)
    const admin = await Admin.findOne({});
    if (!admin) {
      console.log('❌ No admin found. Please create an admin first.');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`👤 Creating messages for: ${user.name} (${user.email})`);
    console.log(`👨‍💼 Sent by Admin: ${admin.name}\n`);

    // Create sample messages
    const messages = [
      {
        userId: user._id,
        sentBy: admin._id,
        title: 'Welcome! Your Account Report',
        message: 'Welcome to Mani Electrical! Your account has been successfully created. You can now browse products and place orders.',
        status: 'Info',
        isRead: false
      },
      {
        userId: user._id,
        sentBy: admin._id,
        title: 'Order Confirmation Report',
        message: 'Your recent order has been confirmed and is being processed. You will receive tracking information soon.',
        status: 'Info',
        isRead: false
      },
      {
        userId: user._id,
        sentBy: admin._id,
        title: 'Payment Received Successfully',
        message: 'We have received your payment successfully. Thank you for your purchase!',
        status: 'Summary',
        isRead: false
      },
      {
        userId: user._id,
        sentBy: admin._id,
        title: 'Important Account Update Required',
        message: 'Please review your account information and update your profile if needed. This is important for order processing.',
        status: 'Warning',
        isRead: false
      },
      {
        userId: user._id,
        sentBy: admin._id,
        title: 'Order Delivery Issue',
        message: 'There seems to be an issue with your order delivery. Please contact customer support.',
        status: 'Issue',
        isRead: false
      }
    ];

    // Insert messages
    const created = await ReportMessage.insertMany(messages);
    
    console.log(`✅ Successfully created ${created.length} report messages!\n`);
    console.log('📨 Messages Created:');
    created.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg.title}`);
      console.log(`   Status: ${msg.status} | Read: ${msg.isRead ? 'Yes' : 'No'}`);
      console.log(`   ID: ${msg._id}\n`);
    });

    // Show total count
    const total = await ReportMessage.countDocuments({ userId: user._id });
    const unread = await ReportMessage.countDocuments({ userId: user._id, isRead: false });
    
    console.log(`📊 Total messages for ${user.name}: ${total}`);
    console.log(`📬 Unread messages: ${unread}`);
    
    console.log('\n✅ Seeding completed! Now login as this user to see the reports.');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedReportMessages();
