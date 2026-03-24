const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables (force reload)
dotenv.config();

// ============================================
// GLOBAL ERROR HANDLERS - PREVENT CRASHES
// ============================================

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.error(`[${timestamp}] [CRITICAL] Uncaught Exception:`, error.message);
  console.error(error.stack);

  // In development, keep the process alive so nodemon does not get stuck in crash loops.
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[${timestamp}] [SERVER] Continuing after uncaught exception in development mode`);
    return;
  }

  // Exit process after logging in non-development environments.
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.error(`[${timestamp}] [CRITICAL] Unhandled Rejection at:`, promise);
  console.error('[CRITICAL] Reason:', reason);
  // Don't exit - continue running but log the issue
});

let isShuttingDown = false;
const gracefulShutdown = (signal, onDone) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] [SERVER] ${signal} signal received: shutting down`);

  // Prevent hanging forever during nodemon restarts.
  const forceExitTimer = setTimeout(() => {
    const ts = new Date().toISOString().split('T')[1].split('.')[0];
    console.warn(`[${ts}] [SERVER] Forced shutdown timeout reached`);
    if (typeof onDone === 'function') {
      onDone();
    } else {
      process.exit(0);
    }
  }, 3000);

  const done = () => {
    clearTimeout(forceExitTimer);
    if (typeof onDone === 'function') {
      onDone();
    } else {
      process.exit(0);
    }
  };

  const closeHttpServer = () => {
    if (global.httpServer) {
      global.httpServer.close(() => {
        const ts = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`[${ts}] [SERVER] HTTP server closed`);
        done();
      });
    } else {
      done();
    }
  };

  if (global.io) {
    global.io.close(() => {
      const ts = new Date().toISOString().split('T')[1].split('.')[0];
      console.log(`[${ts}] [SERVER] Socket.IO server closed`);
      closeHttpServer();
    });
  } else {
    closeHttpServer();
  }
};

// Handle process termination and Ctrl+C.
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Nodemon uses SIGUSR2 for restarts; acknowledge and re-emit when cleanly closed.
process.once('SIGUSR2', () => {
  gracefulShutdown('SIGUSR2', () => process.kill(process.pid, 'SIGUSR2'));
});


// Initialize Express app
const app = express();

// Create HTTP server
const httpServer = http.createServer(app);
global.httpServer = httpServer;

// CORS Configuration
const allowedOrigins = [
  'https://manielectrical.vercel.app',
  'https://www.manielectrical.vercel.app',
];

const isLocalDevOrigin = (origin = '') =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(String(origin || '').trim());

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (isLocalDevOrigin(origin)) return true;
  return allowedOrigins.includes(origin);
};

// Initialize Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to route controllers via req.app.get('io')
app.set('io', io);
global.io = io;

// CORS Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        // Avoid converting CORS blocks into 500 responses.
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Pre-flight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const hasAuth = req.headers.authorization ? '🔐' : '🔓';
  console.log(`[${timestamp}] ${hasAuth} ${req.method} ${req.path}`);
  next();
});

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// Socket.IO Event Handlers
// ============================================
const ReportMessage = require('./models/ReportMessage');

io.on('connection', (socket) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] Socket connected: ${socket.id}`);

  // Handle socket errors
  socket.on('error', (error) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.error(`[${timestamp}] Socket error on ${socket.id}:`, error.message);
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[${timestamp}] Socket disconnected: ${socket.id} - Reason: ${reason}`);
  });

  // User joins their personal room to receive messages
  socket.on('joinUserRoom', (userId) => {
    try {
      if (userId) {
        socket.join(userId);
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`[${timestamp}] User ${userId} joined room`);
      }
    } catch (error) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      console.error(`[${timestamp}] Error in joinUserRoom:`, error.message);
    }
  });

  // Admin sends a report message to a specific user
  socket.on('sendReportMessage', async (data) => {
    let timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    try {
      const { userId, orderId, paymentId, invoiceId, title, message, status, sentBy } = data;

      // Validate required fields
      if (!userId || !title || !message || !sentBy) {
        socket.emit('reportMessageError', { 
          success: false, 
          message: 'Missing required fields: userId, title, message, or sentBy' 
        });
        return;
      }

      // Create the report message in database
      const reportMessage = await ReportMessage.create({
        userId,
        orderId: orderId || undefined,
        paymentId: paymentId || undefined,
        invoiceId: invoiceId || undefined,
        title,
        message,
        status: status || 'Info',
        sentBy,
        isRead: false
      });

      // Populate user and admin references
      await reportMessage.populate('userId', 'name email');
      await reportMessage.populate('sentBy', 'name email');

      console.log(`[${timestamp}] 📨 Report message sent to user ${userId}`);

      // Send to the specific user's room (real-time delivery)
      io.to(userId).emit('receiveReportMessage', {
        success: true,
        message: reportMessage
      });

      // Confirm to sender (admin)
      socket.emit('reportMessageSent', {
        success: true,
        message: 'Report message sent successfully',
        data: reportMessage
      });

    } catch (error) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      console.error(`[${timestamp}] Error sending report message:`, error.message);
      socket.emit('reportMessageError', {
        success: false,
        message: error.message || 'Failed to send report message'
      });
    }
  });
});

// Global Socket.IO error handler
io.engine.on('connection_error', (error) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.error(`[${timestamp}] Socket.IO connection error:`, error.message);
});

// Initialize notification handlers
const notificationHandlers = require('./socket/notificationHandlers');
const NotificationEmitter = notificationHandlers(io);
app.set('notificationEmitter', NotificationEmitter);

// ============================================
// REST API Routes
// ============================================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/admin-management', require('./routes/adminManagementRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/razorpay', require('./routes/razorpayRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/returns', require('./routes/returnRoutes'));
app.use('/api/admin/notifications', require('./routes/notificationRoutes'));
app.use('/api/reports', require('./routes/reportRoutes')); // Legacy reports (backward compatibility)
app.use('/api/admin/reports', require('./routes/adminReportRoutes')); // Admin reports (new)
app.use('/api/user/reports', require('./routes/userReportRoutes')); // User reports (new)
app.use('/api/user/notifications', require('./routes/userNotificationRoutes')); // User notifications
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/refunds', require('./routes/refundRoutes'));
app.use('/api/sales-reports', require('./routes/salesReportRoutes'));
app.use('/api/activity-logs', require('./routes/activityLogRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Electric Shop API',
    version: '1.0.0',
    status: 'Running'
  });
});

// 404 handler (before error middleware)
app.use((req, res) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.warn(`[${timestamp}] 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  
  // Log the error with timestamp
  console.error(`[${timestamp}] [ERROR] ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  
  // Prevent headers already sent error
  if (res.headersSent) {
    return next(err);
  }
  
  // Determine status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.toString() : undefined
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB with improved error handling
const mongoose = require('mongoose');
const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('❌ MONGO_URI (or legacy MONGODB_URI) environment variable is not defined');
  process.exit(1);
}

// Check for placeholder passwords
if (mongoURI.includes('YOUR_NEW_PASSWORD') || 
    mongoURI.includes('YOUR_PASSWORD') ||
    mongoURI.includes('CHANGE_THIS') ||
    mongoURI.includes('REPLACE_THIS')) {
  console.error('\n❌ MongoDB Connection Failed: Placeholder password detected!\n');
  console.error('📝 Fix: Update backend/.env file with your actual MongoDB Atlas password\n');
  console.error('Steps:');
  console.error('1. Go to https://cloud.mongodb.com/');
  console.error('2. Database Access → Edit User → Reset Password');
  console.error('3. Copy new password and update MONGO_URI in .env\n');
  process.exit(1);
}

const connectWithRetry = (retries = 5, delay = 5000) => {
  mongoose.connect(mongoURI)
    .then(async () => {
      console.log('✅ MongoDB Connected');
      // Auto-seed categories if the collection is empty
      try {
        const Category = require('./models/Category');
        const count = await Category.countDocuments();
        if (count === 0) {
          const DEFAULTS = [
            { name: 'Fan',           gst: 18, shipping: 80  },
            { name: 'Lights',        gst: 12, shipping: 50  },
            { name: 'Motors',        gst: 18, shipping: 100 },
            { name: 'Pipes',         gst: 18, shipping: 50  },
            { name: 'Switches',      gst: 18, shipping: 40  },
            { name: 'Tank',          gst: 18, shipping: 150 },
            { name: 'Water Heater',  gst: 18, shipping: 100 },
            { name: 'Wire & Cables', gst: 18, shipping: 60  },
            { name: 'Heater',        gst: 18, shipping: 100 },
            { name: 'Other',         gst: 18, shipping: 60  },
          ];
          await Category.insertMany(DEFAULTS);
          console.log('✅ Categories auto-seeded (10 categories)');
        }
      } catch (seedErr) {
        console.error('⚠️  Category auto-seed failed (non-fatal):', seedErr.message);
      }

      // Start listening only after DB is ready
      httpServer.listen(PORT, '0.0.0.0', () => {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`[${timestamp}] [SERVER] Running on port ${PORT}`);
        console.log(`[${timestamp}] [SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    })
    .catch(err => {
      console.error('\n❌ MongoDB Connection Error:', err.message);

      if (err.message.includes('bad auth') || err.message.includes('authentication failed')) {
        console.error('\n🔐 Authentication failed — check MONGO_URI password in .env\n');
        process.exit(1);
      } else if (err.message.includes('whitelist') || err.message.includes('IP') || err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
        if (retries > 0) {
          console.error(`🔄 Retrying in ${delay / 1000}s... (${retries} attempts left)`);
          console.error('   Tip: Make sure your IP is whitelisted on MongoDB Atlas → Network Access\n');
          setTimeout(() => connectWithRetry(retries - 1, delay), delay);
        } else {
          console.error('\n❌ Could not connect after multiple attempts. Please whitelist your IP on MongoDB Atlas:\n');
          console.error('   https://www.mongodb.com/docs/atlas/security-whitelist/\n');
          console.error(`   Your public IP: run  curl ifconfig.me  to find it\n`);
          process.exit(1);
        }
      } else {
        if (retries > 0) {
          console.error(`🔄 Retrying in ${delay / 1000}s... (${retries} attempts left)\n`);
          setTimeout(() => connectWithRetry(retries - 1, delay), delay);
        } else {
          process.exit(1);
        }
      }
    });
};

// Start Server
const PORT = process.env.PORT || 5000;

httpServer.on('error', (err) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  if (err.code === 'EADDRINUSE') {
    console.error(`[${timestamp}] [ERROR] Port ${PORT} is already in use.`);
    console.error(`[ERROR] Run this to fix it:  npx kill-port ${PORT}`);
    console.error(`[ERROR] Or in PowerShell:    Stop-Process -Id (netstat -ano | Select-String ":${PORT}\\s").ToString().Trim().Split()[-1] -Force`);
    process.exit(1);
  } else {
    console.error(`[${timestamp}] [ERROR] Server error:`, err.message);
    throw err;
  }
});

connectWithRetry();

