const mongoose = require('mongoose');
const User = require('./models/User');
const Admin = require('./models/Admin');
const ReportMessage = require('./models/ReportMessage');
require('dotenv').config();

const testAPIEndpoint = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the user who has messages
    const message = await ReportMessage.findOne()
      .populate('userId', 'name email _id')
      .populate('sentBy', 'name email');

    if (!message) {
      console.log('❌ No report messages found');
      return;
    }

    console.log('📨 Found Message:');
    console.log(`   User ID: ${message.userId._id}`);
    console.log(`   User Name: ${message.userId.name}`);
    console.log(`   User Email: ${message.userId.email}`);
    console.log(`   Subject: ${message.subject}`);
    console.log(`   Message: ${message.message}`);
    console.log(`   Status: ${message.status}`);
    console.log(`   Is Read: ${message.isRead}`);
    console.log(`   Created: ${message.createdAt}\n`);

    // Check all messages for this user
    const userId = message.userId._id;
    const allMessages = await ReportMessage.find({ userId })
      .populate('sentBy', 'name email')
      .sort({ createdAt: -1 });

    console.log(`📊 Total messages for ${message.userId.name}: ${allMessages.length}\n`);

    // Show what the API should return
    const unreadCount = await ReportMessage.countDocuments({ userId, isRead: false });
    
    console.log('🔍 Expected API Response:');
    console.log(JSON.stringify({
      success: true,
      count: allMessages.length,
      totalMessages: allMessages.length,
      unreadCount: unreadCount,
      messages: allMessages.map(m => ({
        _id: m._id,
        subject: m.subject,
        message: m.message,
        status: m.status,
        isRead: m.isRead,
        createdAt: m.createdAt,
        sentBy: m.sentBy ? {
          name: m.sentBy.name,
          email: m.sentBy.email
        } : null
      }))
    }, null, 2));

    console.log('\n💡 To test the API:');
    console.log('1. Make sure the backend server is running');
    console.log('2. Login as: ' + message.userId.email);
    console.log('3. Navigate to User Reports page');
    console.log('4. Check browser console for errors');
    console.log('5. Check Network tab in DevTools for API calls');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
};

testAPIEndpoint();
