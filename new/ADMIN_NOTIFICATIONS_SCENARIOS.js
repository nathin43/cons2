/**
 * ADMIN NOTIFICATION SYSTEM - REAL-WORLD SCENARIOS & TESTING
 * 
 * This file demonstrates how the notification system works
 * in real-world scenarios with actual code flow
 */

// ============================================================
// SCENARIO 1: Order Placed - Complete Flow
// ============================================================

/*
TIMELINE:
- Customer clicks "Place Order"
- Order created in orderController.createOrder()
- Notification created and sent to admin
- Admin sees real-time notification in dashboard

BACKEND FLOW:

1. Order Controller - orderController.js
   exports.createOrder = async (req, res) => {
     try {
       // Create order...
       const order = await Order.create({
         _id: '6547f...',
         orderNumber: 'ORD-001234',
         userId: '507f1...',
         totalAmount: 5450,
         // ... other fields
       });

       // Get main admin
       const mainAdminId = process.env.MAIN_ADMIN_ID;
       
       // Create notification in database
       const notificationService = require('../services/notificationService');
       await notificationService.notifyNewOrder(mainAdminId, {
         orderId: order._id,
         orderNumber: order.orderNumber,
         customerId: req.user._id,
         customerName: req.user.name,
         amount: order.totalAmount,
       });
       
       // Get Socket.IO emitter
       const notificationEmitter = req.app.get('notificationEmitter');
       
       // Emit real-time notification
       if (notificationEmitter) {
         notificationEmitter.emitToAdmin(mainAdminId, {
           _id: '6548a...',
           type: 'NEW_ORDER',
           title: 'New Order Received',
           description: 'Order #ORD-001234 for ₹5,450 from Rajesh Kumar',
           icon: 'shopping-cart',
           color: 'blue',
           read: false,
           createdAt: new Date(),
           data: {
             orderId: '6547f...',
             orderNumber: 'ORD-001234',
             customerId: '507f1...',
             customerName: 'Rajesh Kumar',
             amount: 5450,
           },
         });
       }
       
       return res.json({ success: true, order });
     } catch (error) {
       return res.status(500).json({ success: false, error: error.message });
     }
   };

2. Notification Service - Creates in database
   - Type: NEW_ORDER
   - Title: "New Order Received"
   - Description: "Order #ORD-001234 for ₹5,450 from Rajesh Kumar"
   - Icon: shopping-cart
   - Color: blue
   - Read: false
   - Data: { orderId, orderNumber, customerId, customerName, amount }

3. Socket.IO Handler - Emits in real-time
   - Event: "notification:new"
   - Payload: Complete notification object
   - Room: "admin:6548a..."

FRONTEND FLOW:

1. NotificationContext listens for new notification
   - useNotificationSocket hook sets up socket listeners
   - Receives "notification:new" event
   
2. addNotification() is called
   - Adds notification to state
   - Increments unreadCount
   
3. NotificationBell component updates
   - Badge shows new count (1, 2, 3, etc.)
   - Badge animates (pulse effect)
   
4. User clicks NotificationBell
   - NotificationPanel opens (slide animation)
   - Shows the new order notification at the top
   - Shows "1 unread" at bottom
   
5. Notification Item displays
   - Blue shopping-cart icon
   - Title: "New Order Received"
   - Description: "Order #ORD-001234 for ₹5,450 from Rajesh Kumar"
   - Data tags: 🛒 Ord: ORD-001234, 👤 Rajesh Kumar, ₹5,450
   - Timestamp: "just now"

6. Admin clicks notification
   - Can navigate to order details (actionUrl)
   - Or hover to see more info

7. Admin clicks checkmark
   - Notification marked as read
   - Unread count decreases
   - Notification background becomes lighter
*/

// ============================================================
// SCENARIO 2: Product Out of Stock - Complete Flow
// ============================================================

/*
TIMELINE:
- Admin updates product stock to 0
- Low Stock/Out of Stock notification created
- Admin sees notification immediately

BACKEND CODE:

exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { stock } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      productId,
      { stock: stock },
      { new: true }
    );
    
    const mainAdminId = process.env.MAIN_ADMIN_ID;
    const notificationService = require('../services/notificationService');
    const notificationEmitter = req.app.get('notificationEmitter');
    
    // Check stock level and create appropriate notification
    if (product.stock === 0) {
      // OUT OF STOCK
      await notificationService.notifyOutOfStock(mainAdminId, {
        productId: product._id,
        productName: product.name,
      });
      
      if (notificationEmitter) {
        notificationEmitter.emitToAdmin(mainAdminId, {
          type: 'OUT_OF_STOCK',
          title: 'Product Out of Stock',
          description: 'LED Bulb 40W is now out of stock',
          icon: 'alert-circle',
          color: 'red',
          data: { productId: product._id, productName: product.name },
        });
      }
    } else if (product.stock > 0 && product.stock < 5) {
      // LOW STOCK
      await notificationService.notifyLowStock(mainAdminId, {
        productId: product._id,
        productName: product.name,
        stock: product.stock,
      });
      
      if (notificationEmitter) {
        notificationEmitter.emitToAdmin(mainAdminId, {
          type: 'LOW_STOCK',
          title: 'Low Stock Warning',
          description: 'LED Bulb 40W has only 3 units remaining',
          icon: 'alert-triangle',
          color: 'orange',
          data: { 
            productId: product._id, 
            productName: product.name,
            stock: product.stock 
          },
        });
      }
    }
    
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

FRONTEND:
- Red alert notification appears
- Icon: alert-circle
- Title: "Product Out of Stock"
- Description: "LED Bulb 40W is now out of stock"
- Admin can click to navigate to product details
*/

// ============================================================
// SCENARIO 3: Multiple Admins on Different Pages
// ============================================================

/*
SITUATION:
- Admin 1 (ID: admin1) viewing orders page
- Admin 2 (ID: admin2) viewing products page
- New order arrives

FLOW:

1. Order comes in for any admin
   - Check which admin should get notification
   - Usually: main admin (from env)
   - Or: notify all super admins

2. Emit to specific admin
   notificationEmitter.emitToAdmin('admin1', notification);
   
3. Admin 1's socket receives event
   - If Admin 1 has panel open: shows up immediately
   - If panel closed: bell badge updates
   
4. Admin 2 doesn't receive this notification
   - Unless configured to notify all admins
   
MULTI-ADMIN OPTION:
   const allAdmins = await Admin.find({ role: 'ADMIN' });
   for (const admin of allAdmins) {
     await notificationService.createNotification(admin._id, notificationData);
     notificationEmitter.emitToAdmin(admin._id, notification);
   }
*/

// ============================================================
// SCENARIO 4: New Customer Registration
// ============================================================

/*
BACKEND - authController.js:

exports.register = async (req, res) => {
  try {
    // Create user...
    const user = await User.create({
      _id: '6549f...',
      name: 'Arun Kumar',
      email: 'arun@example.com',
      // ...
    });
    
    const mainAdminId = process.env.MAIN_ADMIN_ID;
    const notificationService = require('../services/notificationService');
    
    await notificationService.notifyNewCustomer(mainAdminId, {
      customerId: user._id,
      customerName: user.name,
      email: user.email,
    });
    
    const notificationEmitter = req.app.get('notificationEmitter');
    if (notificationEmitter) {
      notificationEmitter.emitToAdmin(mainAdminId, {
        type: 'NEW_CUSTOMER',
        title: 'New Customer Joined',
        description: 'Arun Kumar has registered. Email: arun@example.com',
        icon: 'user-plus',
        color: 'purple',
        data: {
          customerId: user._id,
          customerName: user.name,
        },
      });
    }
    
    res.json({ success: true, user, message: 'Registration successful' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

FRONTEND:
- Purple user-plus icon
- Title: "New Customer Joined"
- Description: "Arun Kumar has registered. Email: arun@example.com"
- Data: 👤 Arun Kumar
*/

// ============================================================
// SCENARIO 5: Contact Form Submission
// ============================================================

/*
Customer submits contact form:
- Name: Rajesh
- Email: raj@email.com
- Subject: Product enquiry
- Message: When will LED Bulbs be back in stock?

BACKEND - contactController.js:

exports.createContact = async (req, res) => {
  try {
    const contact = await Contact.create({
      _id: '654aa...',
      name: 'Rajesh',
      email: 'raj@email.com',
      subject: 'Product enquiry',
      message: 'When will LED Bulbs be back in stock?',
    });
    
    const mainAdminId = process.env.MAIN_ADMIN_ID;
    const notificationService = require('../services/notificationService');
    
    await notificationService.notifyContactMessage(mainAdminId, {
      contactId: contact._id,
      from: contact.email,
      subject: contact.subject,
    });
    
    const notificationEmitter = req.app.get('notificationEmitter');
    if (notificationEmitter) {
      notificationEmitter.emitToAdmin(mainAdminId, {
        type: 'CONTACT_MESSAGE',
        title: 'New Contact Message Received',
        description: 'From: raj@email.com - Product enquiry',
        icon: 'mail',
        color: 'blue',
        data: {
          contactId: contact._id,
          from: contact.email,
          subject: contact.subject,
        },
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Thank you for contacting us. We will respond soon.' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

FRONTEND:
- Blue mail icon
- Title: "New Contact Message Received"
- Description: "From: raj@email.com - Product enquiry"
- Data tags show: From, Subject
- Can navigate to contact details page
*/

// ============================================================
// SCENARIO 6: Refund Request
// ============================================================

/*
Customer requests refund for order ORD-001200 (₹450)

BACKEND - returnController.js:

exports.createReturn = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    
    const returnRequest = await Return.create({
      _id: '654bb...',
      orderId: order._id,
      customerId: req.user._id,
      reason: 'Product defective',
      status: 'PENDING',
    });
    
    const mainAdminId = process.env.MAIN_ADMIN_ID;
    const notificationService = require('../services/notificationService');
    
    await notificationService.notifyRefundRequest(mainAdminId, {
      refundId: returnRequest._id,
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId: req.user._id,
      customerName: req.user.name,
      amount: order.totalAmount,
    });
    
    const notificationEmitter = req.app.get('notificationEmitter');
    if (notificationEmitter) {
      notificationEmitter.emitToAdmin(mainAdminId, {
        type: 'REFUND_REQUEST',
        title: 'Refund Request Submitted',
        description: 'Refund for Order #ORD-001200 - ₹450 from Rajesh Kumar',
        icon: 'undo-2',
        color: 'yellow',
        data: {
          refundId: returnRequest._id,
          orderId: order._id,
          orderNumber: order.orderNumber,
          customerName: req.user.name,
          amount: order.totalAmount,
        },
      });
    }
    
    res.json({ success: true, returnRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

FRONTEND:
- Yellow undo-2 icon
- Title: "Refund Request Submitted"
- Description: "Refund for Order #ORD-001200 - ₹450 from Rajesh Kumar"
- Data: 🛒 Ord: ORD-001200, 👤 Rajesh Kumar, ₹450
- Can navigate to refund details
*/

// ============================================================
// SCENARIO 7: Order Cancelled
// ============================================================

/*
Customer cancels order ORD-001199

BACKEND - orderController.js:

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: 'CANCELLED' },
      { new: true }
    );
    
    const mainAdminId = process.env.MAIN_ADMIN_ID;
    const notificationService = require('../services/notificationService');
    
    await notificationService.notifyOrderCancelled(mainAdminId, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId: req.user._id,
      customerName: req.user.name,
    });
    
    const notificationEmitter = req.app.get('notificationEmitter');
    if (notificationEmitter) {
      notificationEmitter.emitToAdmin(mainAdminId, {
        type: 'ORDER_CANCELLED',
        title: 'Order Cancelled by Customer',
        description: 'Order #ORD-001199 has been cancelled by Priya Sharma',
        icon: 'x-circle',
        color: 'red',
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          customerName: req.user.name,
        },
      });
    }
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

FRONTEND:
- Red x-circle icon
- Title: "Order Cancelled by Customer"
- Description: "Order #ORD-001199 has been cancelled by Priya Sharma"
- Data: 🛒 Ord: ORD-001199, 👤 Priya Sharma
*/

// ============================================================
// SCENARIO 8: Sale Notification (Completion)
// ============================================================

/*
Order completed successfully and delivery confirmed
(Could be triggered from order status update)

BACKEND - orderController.js (when status = DELIVERED):

await notificationService.notifySaleCompleted(mainAdminId, {
  productId: order.items[0].productId,
  productName: order.items[0].productName,
  orderId: order._id,
  orderNumber: order.orderNumber,
  customerId: order.customerId,
  customerName: order.customerName,
  amount: order.totalAmount,
});

FRONTEND:
- Green shopping-bag icon
- Title: "New Sale Completed"
- Description: "Rajesh Kumar purchased LED Bulb for ₹450"
- Data: 📦 LED Bulb, 👤 Rajesh Kumar, ₹450
*/

// ============================================================
// API TESTING WITH CURL/POSTMAN
// ============================================================

/*
1. Get all notifications:
   GET http://localhost:50004/api/admin/notifications
   Headers: Authorization: Bearer <admin-token>
   Query: ?limit=50&skip=0
   
   Response:
   {
     "success": true,
     "notifications": [ {...}, {...} ],
     "total": 15,
     "unreadCount": 3
   }

2. Get unread count:
   GET http://localhost:50004/api/admin/notifications/count
   Headers: Authorization: Bearer <admin-token>
   
   Response:
   {
     "success": true,
     "unreadCount": 3
   }

3. Mark notification as read:
   PUT http://localhost:50004/api/admin/notifications/654aa.../read
   Headers: Authorization: Bearer <admin-token>
   
   Response:
   {
     "success": true,
     "message": "Notification marked as read",
     "unreadCount": 2
   }

4. Mark all as read:
   PUT http://localhost:50004/api/admin/notifications/mark-all-read
   Headers: Authorization: Bearer <admin-token>
   
   Response:
   {
     "success": true,
     "message": "All notifications marked as read",
     "unreadCount": 0
   }

5. Delete notification:
   DELETE http://localhost:50004/api/admin/notifications/654aa...
   Headers: Authorization: Bearer <admin-token>
   
   Response:
   {
     "success": true,
     "message": "Notification deleted",
     "unreadCount": 2
   }

6. Clear all:
   DELETE http://localhost:50004/api/admin/notifications
   Headers: Authorization: Bearer <admin-token>
   
   Response:
   {
     "success": true,
     "message": "All notifications cleared",
     "unreadCount": 0
   }
*/

module.exports = {
  scenarios: 8,
  complete: true,
  ready: 'for integration'
};
