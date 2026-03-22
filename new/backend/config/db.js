const mongoose = require('mongoose');

/**
 * Connect to MongoDB Database
 * Uses MongoDB Atlas connection string from .env file
 * Includes retry logic and proper error handling
 */
const connectDB = async (maxRetries = 5) => {
  let retries = 0;

  const connect = async () => {
    try {
      // Set mongoose options
      const options = {
        retryWrites: true,
        w: 'majority',
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        connectTimeoutMS: 10000,
      };

      console.log('🔄 Attempting to connect to MongoDB...');
      const conn = await mongoose.connect(process.env.MONGO_URI, options);

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📊 Database Name: ${conn.connection.name}`);
      console.log('✨ Database connection established successfully\n');
      
      return conn;
    } catch (error) {
      retries++;
      console.error(`❌ Error connecting to MongoDB (Attempt ${retries}/${maxRetries}): ${error.message}`);
      
      if (retries < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retries - 1), 10000);
        console.log(`⏳ Retrying in ${delay / 1000} seconds...\n`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return connect();
      }

      // Provide helpful troubleshooting information
      console.error('\n⚠️  MongoDB Atlas Connection Issues:');
      console.error('1. Check if your IP address is whitelisted in MongoDB Atlas');
      console.error('2. Go to: https://cloud.mongodb.com/v2/');
      console.error('3. Navigate to: Security → Network Access');
      console.error('4. Add your current IP address or use 0.0.0.0/0 (not recommended for production)');
      console.error('5. Verify your connection string in the .env file');
      console.error('6. Check your internet connection\n');
      
      throw error;
    }
  };

  return connect();
};

module.exports = connectDB;
