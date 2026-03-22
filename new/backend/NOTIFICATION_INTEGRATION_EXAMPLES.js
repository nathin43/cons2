/**
 * Integration Examples - How to use Notifications in Controllers
 * 
 * These examples show how to create notifications when various events occur
 * across the application (orders, products, customers, etc.)
 */

// Example 1: In orderController.js - When order is created
// ============================================================
/*
const NotificationService = require('../services/notificationService');

exports.createOrder = async (req, res) => {
  try {
    // ... order creation logic ...
    
    const order = await Order.create(orderData);
    
    // Get the admin ID (you may want to notify all admins or specific admin)
    const mainAdminId = '507f1f77bcf86cd799439011'; // Get from env or database
    
    // Create notification for new order
    await NotificationService.notifyNewOrder(mainAdminId, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId: req.user._id,
      customerName: req.user.name,
      amount: order.totalAmount,
    });
    
    // Emit real-time notification via Socket.IO
    const notificationEmitter = req.app.get('notificationEmitter');
    if (notificationEmitter) {
      notificationEmitter.emitToAdmin(mainAdminId, {
        type: 'NEW_ORDER',
        title: 'New Order Received',
        description: `Order #${order.orderNumber} for ₹${order.totalAmount}`,
        // ... other notification data ...
      });
    }
    
    res.status(201).json({
      success: true,
      order,
      message: 'Order created successfully'
    });
  } catch (error) {
    // error handling
  }
};
*/

// Example 2: In productController.js - When product stock changes
// ================================================================
/*
const NotificationService = require('../services/notificationService');

exports.updateProductStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { stock } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      productId,
      { stock },
      { new: true }
    );
    
    const mainAdminId = '507f1f77bcf86cd799439011';
    const notificationEmitter = req.app.get('notificationEmitter');
    
    // Check if out of stock
    if (product.stock === 0 && product.stock !== undefined) {
      await NotificationService.notifyOutOfStock(mainAdminId, {
        productId: product._id,
        productName: product.name,
      });
      
      if (notificationEmitter) {
        notificationEmitter.emitToAdmin(mainAdminId, {
          type: 'OUT_OF_STOCK',
          title: 'Product Out of Stock',
          description: `${product.name} is now out of stock`,
          color: 'red',
          icon: 'alert-circle',
        });
      }
    }
    // Check if low stock
    else if (product.stock > 0 && product.stock <= 5) {
      await NotificationService.notifyLowStock(mainAdminId, {
        productId: product._id,
        productName: product.name,
        stock: product.stock,
      });
      
      if (notificationEmitter) {
        notificationEmitter.emitToAdmin(mainAdminId, {
          type: 'LOW_STOCK',
          title: 'Low Stock Warning',
          description: `${product.name} has only ${product.stock} units remaining`,
          color: 'orange',
          icon: 'alert-triangle',
        });
      }
    }
    
    res.json({ success: true, product });
  } catch (error) {
    // error handling
  }
};
*/

// Example 3: In authController.js - When new customer registers
// ================================================================
/*
const NotificationService = require('../services/notificationService');

exports.register = async (req, res) => {
  try {
    // ... registration logic ...
    
    const user = await User.create(userData);
    
    // Notify admin of new customer
    const mainAdminId = '507f1f77bcf86cd799439011';
    await NotificationService.notifyNewCustomer(mainAdminId, {
      customerId: user._id,
      customerName: user.name,
      email: user.email,
    });
    
    // Emit real-time notification
    const notificationEmitter = req.app.get('notificationEmitter');
    if (notificationEmitter) {
      notificationEmitter.emitToAdmin(mainAdminId, {
        type: 'NEW_CUSTOMER',
        title: 'New Customer Joined',
        description: `${user.name} has registered. Email: ${user.email}`,
        color: 'purple',
        icon: 'user-plus',
      });
    }
    
    res.status(201).json({ success: true, user });
  } catch (error) {
    // error handling
  }
};
*/

// Example 4: In contactController.js - When new contact message
// ================================================================
/*
const NotificationService = require('../services/notificationService');

exports.createContact = async (req, res) => {
  try {
    const contact = await Contact.create(req.body);
    
    const mainAdminId = '507f1f77bcf86cd799439011';
    await NotificationService.notifyContactMessage(mainAdminId, {
      contactId: contact._id,
      from: contact.email,
      subject: contact.message,
    });
    
    const notificationEmitter = req.app.get('notificationEmitter');
    if (notificationEmitter) {
      notificationEmitter.emitToAdmin(mainAdminId, {
        type: 'CONTACT_MESSAGE',
        title: 'New Contact Message Received',
        description: `From: ${contact.email} - ${contact.subject}`,
        color: 'blue',
        icon: 'mail',
      });
    }
    
    res.status(201).json({ success: true, contact });
  } catch (error) {
    // error handling
  }
};
*/

// Example 5: In returnController.js - When refund requested
// ============================================================
/*
const NotificationService = require('../services/notificationService');

exports.createReturn = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    
    const returnRequest = await Return.create({
      ...req.body,
      status: 'PENDING'
    });
    
    const mainAdminId = '507f1f77bcf86cd799439011';
    await NotificationService.notifyRefundRequest(mainAdminId, {
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
        description: `Refund for Order #${order.orderNumber} - ₹${order.totalAmount}`,
        color: 'yellow',
        icon: 'undo-2',
      });
    }
    
    res.status(201).json({ success: true, returnRequest });
  } catch (error) {
    // error handling
  }
};
*/

// Example 6: In orderController.js - When order is cancelled
// ============================================================
/*
const NotificationService = require('../services/notificationService');

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: 'CANCELLED' },
      { new: true }
    );
    
    const mainAdminId = '507f1f77bcf86cd799439011';
    await NotificationService.notifyOrderCancelled(mainAdminId, {
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
        description: `Order #${order.orderNumber} has been cancelled by ${req.user.name}`,
        color: 'red',
        icon: 'x-circle',
      });
    }
    
    res.json({ success: true, order });
  } catch (error) {
    // error handling
  }
};
*/

// ============================================================
// GETTING THE MAIN ADMIN ID
// ============================================================
/*
Option 1: Store in environment variable
  MAIN_ADMIN_ID=507f1f77bcf86cd799439011

Option 2: Get from database
  const admin = await Admin.findOne({ role: 'SUPER_ADMIN' });
  const mainAdminId = admin._id;

Option 3: Notify all admins with a loop
  const admins = await Admin.find({ role: 'ADMIN' });
  for (const admin of admins) {
    await NotificationService.notifyNewOrder(admin._id, orderData);
    if (notificationEmitter) {
      notificationEmitter.emitToAdmin(admin._id, notification);
    }
  }
*/

module.exports = {
  // This file is for reference only - copy the patterns into your controllers
};
