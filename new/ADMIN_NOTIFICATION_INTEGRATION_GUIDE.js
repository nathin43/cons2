#!/usr/bin/env node

/**
 * ADMIN NOTIFICATION SYSTEM - INTEGRATION CHECKLIST
 * 
 * This file documents exactly how to integrate notifications into other parts
 * of your application. Use this as a guide when adding new notification types
 * or integrating with new features.
 */

// ============================================================================
// PART 1: CREATING A NEW NOTIFICATION TYPE IN THE BACKEND
// ============================================================================

/*
STEP 1: Add the notification type to backend/services/notificationService.js

Example - Creating a "Product Review" notification:

exports.createProductReviewNotification = async (adminId, reviewData) => {
  try {
    const notification = new Notification({
      adminId,
      type: 'product_review',
      title: 'New Product Review',
      message: `Review by ${reviewData.customerName}: "${reviewData.reviewText.substring(0, 50)}..."`,
      description: `Product: ${reviewData.productName}\nRating: ${reviewData.rating}/5`,
      icon: '⭐',
      color: 'yellow',
      data: reviewData,
    });

    await notification.save();
    
    // Emit real-time event
    const NotificationEmitter = global.app.get('notificationEmitter');
    NotificationEmitter.emitNewNotification(adminId, notification);

    return notification;
  } catch (error) {
    console.error('Error creating review notification:', error);
  }
};

STEP 2: Use the notification service in relevant controller

Example - In backend/controllers/reviewController.js:

const { createProductReviewNotification } = require('../services/notificationService');

exports.submitReview = async (req, res) => {
  try {
    const { productId, rating, text } = req.body;
    const userId = req.user._id;

    // ... validation and review creation code ...

    // Create notification for admin
    await createProductReviewNotification(adminId, {
      customerName: req.user.name,
      productName: product.name,
      rating,
      reviewText: text,
      reviewId: review._id
    });

    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

*/

// ============================================================================
// PART 2: TRIGGERING NOTIFICATIONS FROM DIFFERENT CONTROLLERS
// ============================================================================

/*
CONNECTING NOTIFICATIONS TO EXISTING FEATURES:

A. NEW ORDER NOTIFICATION
=====================================
File: backend/controllers/orderController.js
Event: When order is placed
Code:

const { createOrderNotification } = require('../services/notificationService');

// In the placeOrder function:
const order = await Order.create(orderData);

// Send notification to admin
const adminId = await Admin.findOne({ role: 'MAIN_ADMIN' })._id;
await createOrderNotification(adminId, {
  orderId: order._id,
  orderNumber: order.orderNumber,
  customerName: customer.name,
  amount: order.totalAmount,
  items: order.items.length
});

res.json({ success: true, order });


B. LOW STOCK ALERT
=====================================
File: backend/controllers/productController.js
Event: When stock update happens
Code:

const { createLowStockNotification } = require('../services/notificationService');

// In the updateStock function:
const product = await Product.findByIdAndUpdate(productId, { stock: newStock });

if (newStock <= 5 && newStock > 0) {
  const adminId = await Admin.findOne({ role: 'MAIN_ADMIN' })._id;
  await createLowStockNotification(adminId, {
    productId: product._id,
    productName: product.name,
    currentStock: newStock
  });
}


C. NEW CUSTOMER REGISTRATION
=====================================
File: backend/controllers/authController.js
Event: When user registers
Code:

const { createNewCustomerNotification } = require('../services/notificationService');

// In the register function:
const user = await User.create(userData);

const adminId = await Admin.findOne({ role: 'MAIN_ADMIN' })._id;
await createNewCustomerNotification(adminId, {
  customerName: user.name,
  email: user.email,
  registeredAt: user.createdAt
});

res.json({ success: true, token });


D. CONTACT MESSAGE RECEIVED
=====================================
File: backend/controllers/contactController.js
Event: When contact form is submitted
Code:

const { createContactMessageNotification } = require('../services/notificationService');

// In the submitContact function:
const contact = await Contact.create(contactData);

const adminId = await Admin.findOne({ role: 'MAIN_ADMIN' })._id;
await createContactMessageNotification(adminId, {
  contactId: contact._id,
  senderName: contact.name,
  subject: contact.subject,
  message: contact.message.substring(0, 100)
});

res.json({ success: true, message: 'Message sent' });


E. REFUND REQUEST
=====================================
File: backend/controllers/returnController.js
Event: When refund is requested
Code:

const { createRefundRequestNotification } = require('../services/notificationService');

// In the submitRefund function:
const refund = await Return.create(refundData);

const adminId = await Admin.findOne({ role: 'MAIN_ADMIN' })._id;
await createRefundRequestNotification(adminId, {
  orderId: refund.orderId,
  refundId: refund._id,
  amount: refund.refundAmount,
  reason: refund.reason
});

res.json({ success: true, refund });

*/

// ============================================================================
// PART 3: USING NOTIFICATIONS IN THE FRONTEND
// ============================================================================

/*
ACCESSING NOTIFICATIONS IN REACT COMPONENTS:

A. USE IN ADMIN DASHBOARD
=====================================
File: frontend/src/pages/admin/AdminDashboard.jsx

import { useContext, useEffect } from 'react';
import { NotificationContext } from '../../context/NotificationContext';

export default function AdminDashboard() {
  const { notifications, unreadCount, markAsRead, deleteNotification } = useContext(NotificationContext);

  // Notifications automatically update via context
  return (
    <div>
      <h1>Recent Notifications: {unreadCount}</h1>
      
      {notifications.map(notif => (
        <div key={notif._id} onClick={() => markAsRead(notif._id)}>
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
          <button onClick={() => deleteNotification(notif._id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}


B. USE IN CUSTOM COMPONENT
=====================================
File: frontend/src/components/CustomNotificationWidget.jsx

import { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';

export default function CustomNotificationWidget() {
  const { notifications, fetchNotifications } = useContext(NotificationContext);

  return (
    <div className="widget">
      <button onClick={() => fetchNotifications(20)}>Load Notifications</button>
      {notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        <ul>
          {notifications.map(n => <li key={n._id}>{n.title}</li>)}
        </ul>
      )}
    </div>
  );
}


C. FILTER BY TYPE
=====================================
In any component using NotificationContext:

const { notifications } = useContext(NotificationContext);

// Get only order notifications
const orderNotifications = notifications.filter(n => n.type === 'order');

// Get only unread
const unreadNotifications = notifications.filter(n => !n.read);

// Get last 5 notifications
const recentNotifications = notifications.slice(0, 5);

*/

// ============================================================================
// PART 4: SOCKET.IO INTEGRATION
// ============================================================================

/*
LISTENING TO REAL-TIME NOTIFICATIONS:

The useNotificationSocket hook is already initialized in AdminLayout.jsx
and automatically handles all real-time events. However, if you need to
create custom real-time listeners:

File: Any React component using notifications

import { useEffect } from 'react';
import socketService from '../services/socketService';

export default function MyComponent() {
  useEffect(() => {
    // Listen to custom event
    socketService.socket?.on('notification:custom', (data) => {
      console.log('Custom notification received:', data);
      // Handle custom notification
    });

    return () => {
      socketService.socket?.off('notification:custom');
    };
  }, []);

  return <div>Component with real-time listeners</div>;
}

*/

// ============================================================================
// PART 5: API ENDPOINTS INTEGRATION
// ============================================================================

/*
DIRECT API CALLS (if you need to bypass the context):

File: backend/services/yourService.js or frontend components

// FRONTEND EXAMPLE - Direct API call
import API from '../services/api';

async function fetchNotifications() {
  try {
    const response = await API.get('/admin/notifications?limit=50&skip=0');
    console.log('Notifications:', response.data.notifications);
    console.log('Unread count:', response.data.unreadCount);
  } catch (error) {
    console.error('Failed to fetch:', error);
  }
}

async function markAsRead(notificationId) {
  try {
    const response = await API.put(`/admin/notifications/${notificationId}/read`);
    console.log('Marked as read:', response.data);
  } catch (error) {
    console.error('Failed:', error);
  }
}

async function clearAllNotifications() {
  try {
    const response = await API.delete('/admin/notifications/clear-all');
    console.log('Cleared:', response.data);
  } catch (error) {
    console.error('Failed:', error);
  }
}

*/

// ============================================================================
// PART 6: NOTIFICATION SCHEMA EXTENSION
// ============================================================================

/*
IF YOU NEED TO ADD CUSTOM FIELDS TO NOTIFICATIONS:

File: backend/models/Notification.js
Modify the schema to include new fields:

const notificationSchema = new Schema({
  // Existing fields
  adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  icon: { type: String, default: '📢' },
  color: { type: String, default: 'gray' },
  read: { type: Boolean, default: false },
  
  // NEW CUSTOM FIELDS (example)
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  category: { type: String, default: 'general' },
  actionUrl: { type: String }, // Link to relevant page
  actionLabel: { type: String }, // Button text
  customData: { type: Schema.Types.Mixed }, // Any custom data
  
  data: { type: Schema.Types.Mixed },
  read_at: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

Then update the notification service to use these new fields when creating notifications.

*/

// ============================================================================
// PART 7: TROUBLESHOOTING INTEGRATION
// ============================================================================

/*
COMMON INTEGRATION ISSUES & SOLUTIONS:

ISSUE 1: Notifications not appearing
Solution:
  - Check that adminProtect middleware is applied to routes
  - Verify admin JWT token is valid
  - Ensure NotificationProvider wraps the component
  - Check browser console for CORS errors
  - Verify MongoDB connection is active

ISSUE 2: Real-time events not working
Solution:
  - Check Socket.IO connection in DevTools Network tab
  - Verify server.js has Socket.IO middleware
  - Ensure notificationHandlers are properly initialized
  - Check for WebSocket connection errors
  - Fall back to polling (works automatically)

ISSUE 3: Performance degradation with many notifications
Solution:
  - Implement pagination (limit: 50, skip: 0)
  - Clear old notifications (older than 30 days)
  - Use useCallback for expensive operations
  - Implement notification archiving
  - Add database indexes on frequently queried fields

ISSUE 4: Notifications appear for wrong admin
Solution:
  - Ensure adminId is correctly extracted from JWT
  - Verify adminProtect middleware sets req.admin._id
  - Check query filters match current admin
  - Verify no hardcoded admin IDs in code

ISSUE 5: Socket disconnect issues
Solution:
  - Add reconnection logic in socketService
  - Implement heartbeat/ping mechanism
  - Use polling as fallback
  - Check firewall/proxy settings
  - Verify CORS in server.js

*/

// ============================================================================
// PART 8: TESTING INTEGRATION
// ============================================================================

/*
MANUAL TESTING STEPS:

1. Test Backend
   a. Start server: npm start
   b. Monitor logs: Look for connection messages
   c. Test endpoint: curl http://localhost:50004/api/admin/notifications
   d. Verify MongoDB: Check database for Notification collection

2. Test Frontend
   a. Start frontend: npm run dev
   b. Open browser: http://localhost:3003
   c. Login: Use admin account
   d. Check header: Look for 🔔 bell icon
   e. Open DevTools: Monitor Console and Network
   f. Check Socket: Verify Socket.IO connection

3. Test Real-time
   a. Open admin in 2 browser tabs
   b. Create event in one tab (place order, register user)
   c. Verify notification appears in both tabs
   d. Check badge count updates
   e. Test Socket reconnection

4. Test CRUD Operations
   a. Fetch notifications: Works?
   b. Mark as read: Status updates?
   c. Delete single: Item removed?
   d. Clear all: All removed?
   e. Count updates: Accurate?

5. Test Edge Cases
   a. 100+ notifications: Performance OK?
   b. No notifications: Empty state shows?
   c. Rapid events: Handled correctly?
   d. Network disconnect: Reconnects?
   e. Expired token: Proper error?

*/

// ============================================================================
// PART 9: MONITORING & LOGGING
// ============================================================================

/*
ADD MONITORING TO YOUR NOTIFICATION SYSTEM:

File: backend/services/notificationService.js
Add after creating notification:

// Log notification creation
console.log(`[NOTIFICATION] Created: ${notification.type} for admin ${adminId}`);

// Track in monitoring system (Sentry, LogRocket, etc.)
if (process.env.SENTRY_DSN) {
  Sentry.captureMessage(`Notification: ${notification.type}`, 'info');
}

// Track analytics
database.analytics.push({
  event: 'notification_created',
  type: notification.type,
  adminId,
  timestamp: new Date(),
  metadata: notification.data
});

*/

// ============================================================================
// PART 10: MIGRATION GUIDE
// ============================================================================

/*
IF YOU NEED TO MIGRATE EXISTING NOTIFICATIONS:

File: backend/migrate-notifications.js

const Notification = require('./models/Notification');
const Admin = require('./models/Admin');

async function migrateNotifications() {
  try {
    const mainAdmin = await Admin.findOne({ role: 'MAIN_ADMIN' });
    
    // Find old notifications in different collection (if any)
    const oldNotifications = await db.collection('old_notifications').find().toArray();
    
    // Transform and insert into new collection
    const transformed = oldNotifications.map(notif => ({
      adminId: mainAdmin._id,
      type: notif.type || 'general',
      title: notif.title,
      message: notif.message,
      icon: notif.icon || '📢',
      color: notif.color || 'gray',
      read: notif.read || false,
      data: notif.data || {},
      createdAt: notif.createdAt || new Date(),
    }));
    
    await Notification.insertMany(transformed);
    console.log(`✅ Migrated ${transformed.length} notifications`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

Run: node migrate-notifications.js

*/

// ============================================================================
// QUICK REFERENCE - COPY PASTE CODE SNIPPETS
// ============================================================================

/*
SNIPPET 1: Create notification in any controller

const { createNotification } = require('../services/notificationService');
const Admin = require('../models/Admin');

const mainAdmin = await Admin.findOne({ role: 'MAIN_ADMIN' })._id;
await createNotification(mainAdmin, {
  type: 'your_type',
  title: 'Title', 
  message: 'Message',
  icon: '🔔',
  color: 'blue'
});


SNIPPET 2: Use notifications in React component

import { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';

const { notifications, unreadCount } = useContext(NotificationContext);


SNIPPET 3: Listen to socket event

import socketService from '../services/socketService';

useEffect(() => {
  socketService.onNewNotification((notif) => {
    console.log('New:', notif);
  });
}, []);


SNIPPET 4: Fetch via API

const { data } = await API.get('/admin/notifications');
console.log(data.notifications);


SNIPPET 5: Full integration boilerplate

// 1. Create notification in backend
await createNotification(adminId, { type, title, message, icon, color });

// 2. Socket emits automatically
// 3. Frontend hook receives event
// 4. Context updates state
// 5. Components re-render
// 6. UI shows notification

*/

console.log(`
╔════════════════════════════════════════════════════════╗
║   ADMIN NOTIFICATION SYSTEM INTEGRATION COMPLETE       ║
║                                                        ║
║   Read this file for detailed integration instructions ║
║   Copy snippets for quick implementation               ║
║   Refer to Part 1-10 for specific use cases            ║
╚════════════════════════════════════════════════════════╝

Next Steps:
1. Review relevant sections (Part 1-5)
2. Copy code snippets to your controllers
3. Test with the Testing section (Part 8)
4. Monitor with Part 9 suggestions
5. Refer back as needed for new features

Questions? Check:
- ADMIN_NOTIFICATION_SYSTEM_COMPLETE.md (Full reference)
- ADMIN_NOTIFICATION_QUICKSTART.md (Quick guide)
- TEST_NOTIFICATION_SYSTEM.js (Verification)
`);
