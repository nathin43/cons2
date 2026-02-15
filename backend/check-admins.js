const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');

dotenv.config();

async function checkAdmins() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const admins = await Admin.find().select('name email role');
    console.log('\nCurrent admins in DB:');
    console.log(admins);

    const mainAdmin = await Admin.findOne({ email: 'manielectricals@gmail.com' });
    if (mainAdmin) {
      console.log('\n✅ MAIN_ADMIN found:', mainAdmin.email, 'Role:', mainAdmin.role);
    } else {
      console.log('\n❌ MAIN_ADMIN not found');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAdmins();
