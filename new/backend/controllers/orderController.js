const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Report = require('../models/Report');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const User = require('../models/User');
const Admin = require('../models/Admin');
const NotificationService = require('../services/notificationService');
const UserNotificationService = require('../services/userNotificationService');
const WhatsAppService = require('../services/whatsappService');
const { upsertUserReportSummary } = require('../services/userReportSummaryService');
const { calculateOrderTotals } = require('../utils/pricingUtils');

/**
 * Create new order
 * @route POST /api/orders
 * @access Private
 */
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, paymentDetails } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items in order'
      });
    }

    // Calculate total price (items only, no shipping or tax)
    let totalPrice = 0;
    const orderItems = [];

    for (let item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      // Check stock
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      totalPrice += product.price * item.quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        category: product.category || 'Other',
        quantity: item.quantity,
        price: product.price
      });
    }

    // Compute GST + shipping using category-based pricing rules
    const { subtotal, gst, shipping, total } = calculateOrderTotals(orderItems);

    // Create order (use new + save to trigger pre-save hook for orderNumber)
    const order = new Order({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentDetails: paymentDetails || {}, // Store payment details if provided
      subtotal,
      gst,
      shipping,
      totalAmount: total,
      paymentStatus: paymentMethod === 'Cash on Delivery' ? 'pending' : 'pending'
    });

    await order.save();

    // Deduct stock after order is safely committed to DB.
    // Using individual fetches and .save() to ensure the pre-save hook 
    // in Product model (which updates 'status' based on stock level) is triggered.
    const stockMainAdmin = await Admin.findOne({ role: 'MAIN_ADMIN' }).select('_id').lean();
    for (const stockItem of orderItems) {
      try {
        const product = await Product.findById(stockItem.product);
        if (product) {
          product.stock -= stockItem.quantity;
          await product.save(); // triggers status update middleware
          try {
            if (stockMainAdmin) {
              if (product.stock === 0) {
                await NotificationService.notifyOutOfStock(stockMainAdmin._id, {
                  productId: product._id,
                  productName: product.name,
                });
              } else if (product.stock <= 5) {
                await NotificationService.notifyLowStock(stockMainAdmin._id, {
                  productId: product._id,
                  productName: product.name,
                  stock: product.stock,
                });
              }
            }
          } catch (notifError) {
            console.error('Stock notification error (non-fatal):', notifError.message);
          }
        }
      } catch (stockErr) {
        console.error(`Stock deduction error for ${stockItem.name} (non-fatal):`, stockErr.message);
      }
    }

    // Create Payment record
    try {
      await Payment.create({
        order: order._id,
        user: req.user.id,
        amount: total,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'Cash on Delivery' ? 'pending' : 'pending',
      });
    } catch (payErr) {
      console.error('Payment record creation error (non-fatal):', payErr.message);
    }

    // AUTO-GENERATE REPORT WHEN ORDER IS PLACED
    try {
      const user = await require('../models/User').findById(req.user.id);
      
      const reportItems = orderItems.map(item => ({
        product: item.product,
        productName: item.name,
        productPrice: item.price,
        quantity: item.quantity,
        itemTotal: item.price * item.quantity
      }));

      const reportData = {
        user: req.user.id,
        userName: user.name,
        userEmail: user.email,
        order: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        orderDate: order.createdAt,
        items: reportItems,
        totalAmount: total,
        paymentMethod: paymentMethod,
        transactionId: null,
        paymentStatus: 'pending',
        paymentDate: null,
        shippingAddress: shippingAddress,
        reportType: 'Order Report',
        reportStatus: 'Generated'
      };

      await Report.create(reportData);
    } catch (reportError) {
      // Log error but don't fail order creation
      console.error('Error creating report for order:', reportError.message);
    }

    try {
      await upsertUserReportSummary(req.user.id);
    } catch (summaryError) {
      console.error('Error syncing user report summary after order creation:', summaryError.message);
    }

    // Remove only the ordered items from the cart; leave other items intact
    try {
      const orderedProductIds = orderItems.map(item => item.product.toString());
      const userCart = await Cart.findOne({ user: req.user.id });
      if (userCart) {
        userCart.items = userCart.items.filter(
          cartItem => !orderedProductIds.includes(cartItem.product.toString())
        );
        userCart.totalAmount = userCart.items.reduce(
          (sum, cartItem) => sum + (cartItem.price * cartItem.quantity), 0
        );
        await userCart.save();
      }
    } catch (cartError) {
      console.error('Error removing ordered items from cart (non-fatal):', cartError.message);
    }

    // Notify admin of new order
    try {
      const customer = await User.findById(req.user.id).select('name').lean();
      const mainAdmin = await Admin.findOne({ role: 'MAIN_ADMIN' }).select('_id').lean();
      if (mainAdmin) {
        await NotificationService.notifyNewOrder(mainAdmin._id, {
          orderId: order._id,
          orderNumber: order.orderNumber,
          customerId: req.user.id,
          customerName: customer?.name || 'Customer',
          amount: total,
          itemCount: orderItems.length,
        });
      }
    } catch (notifError) {
      console.error('New order notification error (non-fatal):', notifError.message);
    }

    // Notify user: order placed
    try {
      await UserNotificationService.notifyOrderPlaced(req.user.id, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: total,
      });
    } catch (err) {
      console.error('User order-placed notification error (non-fatal):', err.message);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get user's orders
 * @route GET /api/orders/myorders
 * @access Private
 */
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Error in getMyOrders:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get single order by ID
 * @route GET /api/orders/:id
 * @access Private
 */
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all orders (Admin only)
 * @route GET /api/orders
 * @access Private/Admin
 */
exports.getAllOrders = async (req, res) => {
  try {
    console.log('📦 Fetching all orders for admin...');

    const { fromDate, toDate } = req.query;
    const query = {};

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort('-createdAt');

    console.log(`✅ Found ${orders.length} orders`);

    // Calculate total sales using totalAmount field (totalPrice for backward compatibility)
    const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || order.totalPrice || 0), 0);

    // Always return 200 with success true, even if orders array is empty
    res.status(200).json({
      success: true,
      count: orders.length,
      totalSales,
      orders: orders || [] // Ensure orders is always an array
    });
  } catch (error) {
    console.error('❌ Error in getAllOrders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch orders',
      orders: [] // Return empty array even on error
    });
  }
};

/**
 * Get order details for report message auto-fill (Admin only)
 * @route GET /api/orders/:id/report-details
 * @access Private/Admin
 */
exports.getOrderReportDetails = async (req, res) => {
  try {
    const identifier = req.params.id;
    let order;

    // Try to find by MongoDB ObjectId first
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(identifier)
        .populate('user', '_id name email')
        .select('orderNumber user paymentMethod paymentDetails paymentStatus totalAmount orderStatus');
    }
    
    // If not found or not a valid ObjectId, try finding by order number
    if (!order) {
      order = await Order.findOne({ orderNumber: identifier })
        .populate('user', '_id name email')
        .select('orderNumber user paymentMethod paymentDetails paymentStatus totalAmount orderStatus');
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const reportDetails = {
      userId: order.user._id,
      userName: order.user.name,
      userEmail: order.user.email,
      orderId: order.orderNumber,
      paymentId: order.paymentDetails?.razorpayPaymentId || 
                 order.paymentDetails?.paymentId || 
                 order.paymentDetails?.transactionId || 
                 null,
      invoiceId: `INV-${order.orderNumber}`,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      totalAmount: order.totalAmount
    };

    res.status(200).json({
      success: true,
      details: reportDetails
    });
  } catch (error) {
    console.error('Error fetching order report details:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update order status (Admin only)
 * @route PUT /api/orders/:id/status
 * @access Private/Admin
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Log the update for debugging
    console.log(`Updating order ${orderId}: status from ${order.orderStatus} to ${orderStatus}, totalAmount: ₹${order.totalAmount}`);

    order.orderStatus = orderStatus;
    if (orderStatus === 'cancelled') {
      order.cancelled = true;
      order.cancelledAt = order.cancelledAt || new Date();
      order.cancelledBy = order.cancelledBy || 'Admin';
      order.cancelReason = order.cancelReason || 'Cancelled by admin';
    }

    if (orderStatus === 'delivered') {
      order.deliveredAt = Date.now();
      order.paymentStatus = 'paid';
    }

    await order.save();

    try {
      await upsertUserReportSummary(order.user.toString());
    } catch (summaryError) {
      console.error('Error syncing user report summary after status update:', summaryError.message);
    }

    // Notify user of order status change
    try {
      const orderData = { orderId: order._id, orderNumber: order.orderNumber };
      if (orderStatus === 'confirmed' || orderStatus === 'processing') {
        await UserNotificationService.notifyOrderConfirmed(order.user.toString(), orderData);
      } else if (orderStatus === 'shipped') {
        await UserNotificationService.notifyOrderShipped(order.user.toString(), orderData);
      } else if (orderStatus === 'delivered') {
        await UserNotificationService.notifyOrderDelivered(order.user.toString(), orderData);
      } else if (orderStatus === 'cancelled' || orderStatus === 'rejected') {
        await UserNotificationService.notifyOrderRejected(order.user.toString(), orderData);
      }
    } catch (err) {
      console.error('User order-status notification error (non-fatal):', err.message);
    }

    // Log the result
    console.log(`Order ${orderId} updated successfully. New status: ${order.orderStatus}, Amount: ₹${order.totalAmount}`);

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      order
    });
  } catch (error) {
    console.error(`Error updating order status:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Cancel order
 * @route PUT /api/orders/:id/cancel
 * @access Private
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { cancelReason, customCancelReason, supportMessage } = req.body || {};

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Only allow cancellation for pending/confirmed orders
    // Prevent stock inflation from double-cancels by explicitly checking 'cancelled'
    if (['processing', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order at this stage (Status: ${order.orderStatus})`
      });
    }

    const selectedReason = String(cancelReason || '').trim();
    const customReason = String(customCancelReason || '').trim();
    const optionalSupportMessage = String(supportMessage || '').trim();
    const isOtherReason = ['other', 'other reason'].includes(selectedReason.toLowerCase());
    const finalCancelReason = isOtherReason ? customReason : selectedReason;

    if (!finalCancelReason) {
      return res.status(400).json({
        success: false,
        message: 'Please select a cancellation reason before cancelling the order.'
      });
    }

    // Restore product stock
    // Using individual fetches and .save() to ensure the pre-save hook 
    // in Product model (which updates 'status' based on stock level) is triggered.
    for (let item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    const cancelledBy = req.user?.role === 'admin' ? 'Admin' : 'User';
    order.orderStatus = 'cancelled';
    order.cancelled = true;
    order.cancelReason = finalCancelReason;
    order.cancelledAt = new Date();
    order.cancelledBy = cancelledBy;
    await order.save();

    // Create a refund request automatically for paid orders.
    if (order.paymentStatus === 'paid') {
      try {
        const existingRefund = await Refund.findOne({
          order: order._id,
          refundStatus: { $nin: ['rejected'] }
        });

        if (!existingRefund) {
          await Refund.create({
            order: order._id,
            user: order.user,
            amount: order.totalAmount,
            reason: `Order cancelled by ${cancelledBy}. Reason: ${finalCancelReason}`,
            cancelReason: finalCancelReason,
            userMessage: optionalSupportMessage || null,
            paymentMethod: order.paymentMethod || null,
            source: 'order_cancellation',
            refundStatus: 'pending',
            adminNotes: optionalSupportMessage
              ? `User message: ${optionalSupportMessage}`
              : null,
          });

          // Persist refund state on payment record for transparency in user/admin flows.
          await Payment.findOneAndUpdate(
            { order: order._id },
            { paymentStatus: 'refunded' }
          );
        }
      } catch (refundError) {
        console.error('Auto refund creation error (non-fatal):', refundError.message);
      }
    }

    // Notify admin of cancelled order
    try {
      const customer = await User.findById(order.user).select('name').lean();
      const mainAdmin = await Admin.findOne({ role: 'MAIN_ADMIN' }).select('_id').lean();
      if (mainAdmin) {
        await NotificationService.notifyOrderCancelled(mainAdmin._id, {
          orderId: order._id,
          orderNumber: order.orderNumber,
          customerId: order.user,
          customerName: customer?.name || 'Customer',
          cancellationMessage: optionalSupportMessage || null,
        });
      }
    } catch (notifError) {
      console.error('Cancel order notification error (non-fatal):', notifError.message);
    }

    // Notify user: order cancelled (in-app)
    try {
      await UserNotificationService.notifyOrderCancelled(order.user.toString(), {
        orderId: order._id,
        orderNumber: order.orderNumber,
      });
    } catch (err) {
      console.error('User cancel notification error (non-fatal):', err.message);
    }

    // Notify user: WhatsApp message
    try {
      const userForWhatsApp = await User.findById(order.user).select('name phone').lean();
      if (userForWhatsApp?.phone) {
        await WhatsAppService.notifyOrderCancelled(userForWhatsApp.phone, {
          userName: userForWhatsApp.name || 'Customer',
          orderNumber: order.orderNumber,
        });
      }
    } catch (waErr) {
      console.error('WhatsApp cancel notification error (non-fatal):', waErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get orders by user ID (Admin only)
 * @route GET /api/orders/user/:userId
 * @access Private/Admin
 */
exports.getOrdersByUserId = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
