const crypto = require('crypto');
const getRazorpay = require('../config/razorpay');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Report = require('../models/Report');
const Admin = require('../models/Admin');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');
const UserNotificationService = require('../services/userNotificationService');
const { upsertUserReportSummary } = require('../services/userReportSummaryService');
const { calculateOrderTotals } = require('../utils/pricingUtils');

/**
 * Create a Razorpay order (does NOT save order to DB yet)
 * @route  POST /api/razorpay/create-order
 * @access Private
 */
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    // Validate stock and compute amount
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      totalAmount += product.price * item.quantity;
      validatedItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        category: product.category || 'Other',
        quantity: item.quantity,
        price: product.price
      });
    }

    // Compute GST + shipping using category-based pricing rules
    const pricing = calculateOrderTotals(validatedItems);
    const { subtotal, gst, shipping, total } = pricing;

    // Razorpay amount is in paise (INR × 100) — charge the full total including GST + shipping
    const razorpay = getRazorpay(); // validates keys; throws if missing
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,       // paise
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      // Pass validated items & pricing back so frontend doesn't need to re-send
      validatedItems,
      subtotal,
      gst,
      shipping,
      totalAmount: total,
      shippingAddress
    });
  } catch (error) {
    console.error('Razorpay create-order error:', error);
    // Razorpay SDK wraps API errors inside error.error.description
    const message =
      error?.error?.description ||
      error?.message ||
      'Failed to create Razorpay order. Check server logs.';
    res.status(500).json({ success: false, message });
  }
};

/**
 * Verify Razorpay signature, then save order in DB as Paid
 * @route  POST /api/razorpay/verify-payment
 * @access Private
 */
exports.verifyAndSaveOrder = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      items,            // validated items from previous step
      shippingAddress,
      totalAmount,
      subtotal,
      gst,
      shipping
    } = req.body;

    // ── Signature verification ──────────────────────────────────────────────
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.'
      });
    }
    // ────────────────────────────────────────────────────────────────────────

    // Deduct stock now that payment is confirmed
    // Using individual fetches and .save() to ensure the pre-save hook 
    // in Product model (which updates 'status' based on stock level) is triggered.
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock -= item.quantity;
        await product.save(); // triggers status update middleware
      }
    }

    // Save order as Paid + Confirmed
    const order = new Order({
      user: req.user.id,
      items,
      shippingAddress,
      paymentMethod: 'RAZORPAY',
      subtotal:     subtotal  || 0,
      gst:          gst       || 0,
      shipping:     shipping  || 0,
      totalAmount,
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });

    await order.save();

    // Remove only the ordered items from the cart; leave other items intact
    try {
      const Cart = require('../models/Cart');
      const orderedProductIds = items.map(item => item.product.toString());
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

    // Create Payment record
    try {
      const Payment = require('../models/Payment');
      await Payment.create({
        order: order._id,
        user: req.user.id,
        amount: totalAmount,
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'paid',
        transactionId: razorpayPaymentId,
        gatewayResponse: { razorpayOrderId, razorpayPaymentId, razorpaySignature },
        paidAt: new Date(),
      });
    } catch (payErr) {
      console.error('Payment record creation error (non-fatal):', payErr.message);
    }

    // Auto-generate report
    try {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);

      const reportItems = items.map(item => ({
        product: item.product,
        productName: item.name,
        productPrice: item.price,
        quantity: item.quantity,
        itemTotal: item.price * item.quantity
      }));

      await Report.create({
        user: req.user.id,
        userName: user.name,
        userEmail: user.email,
        order: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        orderDate: order.createdAt,
        items: reportItems,
        totalAmount,
        paymentMethod: 'RAZORPAY',
        transactionId: razorpayPaymentId,
        paymentStatus: 'paid',
        paymentDate: new Date(),
        shippingAddress,
        reportType: 'Order Report',
        reportStatus: 'Generated'
      });
    } catch (reportErr) {
      console.error('Report creation error (non-fatal):', reportErr.message);
    }

    try {
      await upsertUserReportSummary(req.user.id);
    } catch (summaryErr) {
      console.error('Summary sync error (non-fatal):', summaryErr.message);
    }

    // Notify admin of new Razorpay order
    try {
      const customer = await User.findById(req.user.id).select('name').lean();
      const mainAdmin = await Admin.findOne({ role: 'MAIN_ADMIN' }).select('_id').lean();
      if (mainAdmin) {
        await NotificationService.notifyNewOrder(mainAdmin._id, {
          orderId: order._id,
          orderNumber: order.orderNumber,
          customerId: req.user.id,
          customerName: customer?.name || 'Customer',
          amount: totalAmount,
          itemCount: items.length,
        });
      }
    } catch (notifError) {
      console.error('New Razorpay order admin notification error (non-fatal):', notifError.message);
    }

    // Notify user: order placed
    try {
      await UserNotificationService.notifyOrderPlaced(req.user.id, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: totalAmount,
      });
    } catch (err) {
      console.error('User order-placed notification error (non-fatal):', err.message);
    }

    res.status(201).json({
      success: true,
      message: 'Payment verified. Order placed successfully.',
      order
    });
  } catch (error) {
    console.error('Razorpay verify-payment error:', error);
    const message =
      error?.error?.description ||
      error?.message ||
      'Payment verification failed. Check server logs.';
    res.status(500).json({ success: false, message });
  }
};
