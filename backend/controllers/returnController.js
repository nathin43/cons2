const Return = require("../models/Return");
const Refund = require('../models/Refund');
const Contact = require("../models/Contact");
const User = require("../models/User");
const Admin = require('../models/Admin');
const Order = require('../models/Order');
const RefundMessage = require('../models/RefundMessage');
const NotificationService = require('../services/notificationService');

/**
 * Submit a new return request
 * POST /api/returns
 */
exports.submitReturn = async (req, res) => {
  try {
    const { name, email, phone, category, orderId, reason, message, type } =
      req.body;

    // Validation
    if (!name || !email || !phone || !category || !reason || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Create new return request
    const newReturn = new Return({
      name,
      email,
      phone,
      category,
      orderId: orderId || null,
      reason,
      message,
      type: type || "easy-return",
      status: "new",
    });

    await newReturn.save();

    // Notify admin of new return/refund request
    try {
      const mainAdmin = await Admin.findOne({ role: 'MAIN_ADMIN' }).select('_id').lean();
      if (mainAdmin) {
        // Try to look up the order amount using the customer-typed orderId string
        let orderAmount = null;
        if (orderId) {
          const relatedOrder = await Order.findOne({ orderNumber: orderId })
            .select('totalAmount')
            .lean();
          if (relatedOrder) orderAmount = relatedOrder.totalAmount;
        }

        await NotificationService.notifyRefundRequest(mainAdmin._id, {
          refundId: newReturn._id,
          // orderId is a customer-typed string like "ORD1234" — pass as orderNumber (String)
          // Never put it in data.orderId (ObjectId field) — causes Mongoose CastError
          orderNumber: orderId || null,
          customerId: null,
          customerName: name,
          amount: orderAmount,
          category: category,
          reason: reason,
        });
      }
    } catch (notifError) {
      console.error('Return notification error (non-fatal):', notifError.message);
    }

    // Emit real-time notification to all connected admins
    const io = req.app.get('io');
    if (io) {
      io.emit('newReturnRequest', {
        returnId: newReturn.returnId,
        name: newReturn.name,
        orderId: newReturn.orderId,
        category: newReturn.category,
        reason: newReturn.reason,
        createdAt: newReturn.createdAt
      });
    }

    res.status(201).json({
      success: true,
      message: 'Return request submitted successfully',
      returnId: newReturn.returnId,
    });
  } catch (error) {
    console.error("Error submitting return:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting return request",
      error: error.message,
    });
  }
};

/**
 * Get all return requests (Admin only)
 * GET /api/returns
 */
exports.getAllReturns = async (req, res) => {
  try {
    const returns = await Return.find({ type: 'easy-return' }).sort({ createdAt: -1 }).lean();

    // Enrich with order payment context when return records do not already contain it.
    const orderNumbers = Array.from(
      new Set(
        returns
          .map((entry) => String(entry.orderId || '').trim())
          .filter(Boolean)
      )
    );

    let orderByNumber = new Map();
    if (orderNumbers.length > 0) {
      const relatedOrders = await Order.find({ orderNumber: { $in: orderNumbers } })
        .select('orderNumber totalAmount paymentStatus paymentMethod items')
        .lean();
      orderByNumber = new Map(relatedOrders.map((order) => [order.orderNumber, order]));
    }

    const emails = Array.from(
      new Set(
        returns
          .map((entry) => String(entry.email || '').trim().toLowerCase())
          .filter(Boolean)
      )
    );

    let userPhoneByEmail = new Map();
    if (emails.length > 0) {
      const relatedUsers = await User.find({ email: { $in: emails } })
        .select('email phone')
        .lean();
      userPhoneByEmail = new Map(
        relatedUsers.map((user) => [String(user.email || '').trim().toLowerCase(), user.phone || null])
      );
    }

    const returnIds = returns.map((entry) => String(entry.returnId || '')).filter(Boolean);
    const latestMessageByReturnId = new Map();
    const messageCountByReturnId = new Map();

    if (returnIds.length > 0) {
      const allMessages = await RefundMessage.find({ refundId: { $in: returnIds } })
        .sort({ createdAt: 1 })
        .lean();

      allMessages.forEach((message) => {
        const key = String(message.refundId || '');
        if (!key) return;
        messageCountByReturnId.set(key, (messageCountByReturnId.get(key) || 0) + 1);
        latestMessageByReturnId.set(key, message);
      });
    }

    const enrichedReturns = returns.map((entry) => {
      const orderMeta = orderByNumber.get(String(entry.orderId || '').trim());
      const latestMessage = latestMessageByReturnId.get(String(entry.returnId || ''));
      const emailKey = String(entry.email || '').trim().toLowerCase();
      const verifiedPhone = userPhoneByEmail.get(emailKey) || entry.phone || null;
      return {
        ...entry,
        phone: verifiedPhone,
        customerPhone: verifiedPhone,
        paymentStatus: entry.paymentStatus || orderMeta?.paymentStatus || null,
        paymentMethod: entry.paymentMethod || orderMeta?.paymentMethod || null,
        amount: entry.amount ?? orderMeta?.totalAmount ?? null,
        product: entry.category || orderMeta?.items?.[0]?.name || null,
        lastMessage: latestMessage?.message || null,
        lastMessageSender: latestMessage?.sender || null,
        lastMessageAt: latestMessage?.createdAt || null,
        messageCount: messageCountByReturnId.get(String(entry.returnId || '')) || 0,
      };
    });

    res.status(200).json({
      success: true,
      returns: enrichedReturns,
      count: enrichedReturns.length,
    });
  } catch (error) {
    console.error("Error fetching returns:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching return requests",
      error: error.message,
    });
  }
};

/**
 * Get a specific return request by ID (Admin only)
 * GET /api/returns/:id
 */
exports.getReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    const returnRequest = await Return.findOne({ returnId: id });

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    res.status(200).json({
      success: true,
      return: returnRequest,
    });
  } catch (error) {
    console.error("Error fetching return:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching return request",
      error: error.message,
    });
  }
};

/**
 * Update return request status (Admin only)
 * PUT /api/returns/:id
 */
exports.updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Please provide status",
      });
    }

    const returnRequest = await Return.findOne({ returnId: id });

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    returnRequest.status = status;
    returnRequest.adminNotes = adminNotes || '';
    returnRequest.updatedAt = Date.now();
    await returnRequest.save();

    // Move approved product returns into Refund Requests module.
    if (status === 'approved' && returnRequest.type === 'easy-return') {
      const existingRefund = await Refund.findOne({ sourceReturnId: returnRequest.returnId });
      if (!existingRefund) {
        const order = returnRequest.orderId
          ? await Order.findOne({ orderNumber: returnRequest.orderId }).select('_id user orderNumber totalAmount paymentMethod paymentStatus items').lean()
          : null;

        const refund = await Refund.create({
          order: order?._id || null,
          user: order?.user || null,
          orderNumber: order?.orderNumber || returnRequest.orderId || null,
          customerName: returnRequest.name,
          customerEmail: returnRequest.email,
          customerPhone: returnRequest.phone,
          refundType: 'return-refund',
          sourceReturnId: returnRequest.returnId,
          productSummary: returnRequest.category || (order?.items?.[0]?.name || null),
          paymentMethod: order?.paymentMethod || returnRequest.paymentMethod || null,
          paymentStatus: order?.paymentStatus || returnRequest.paymentStatus || null,
          amount: typeof returnRequest.amount === 'number'
            ? returnRequest.amount
            : (order?.totalAmount || 0),
          reason: returnRequest.reason || 'Approved return refund',
          refundStatus: 'pending',
          adminNotes: 'Auto-created from approved return request.',
        });

        await RefundMessage.create({
          refundId: String(refund._id),
          sender: 'USER',
          message: returnRequest.message || 'Return approved. Requesting refund update.',
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Return request updated successfully",
      return: returnRequest,
    });
  } catch (error) {
    console.error("Error updating return:", error);
    res.status(500).json({
      success: false,
      message: "Error updating return request",
      error: error.message,
    });
  }
};

/**
 * Delete a return request (Admin only)
 * DELETE /api/returns/:id
 */
exports.deleteReturn = async (req, res) => {
  try {
    const { id } = req.params;

    const returnRequest = await Return.findOneAndDelete({ returnId: id });

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    res.status(200).json({
      success: true,
      message: 'Return request deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting return:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting return request',
      error: error.message,
    });
  }
};

/**
 * Get count of pending/new return requests (Admin only)
 * GET /api/returns/pending-count
 */
exports.getPendingCount = async (req, res) => {
  try {
    const count = await Return.countDocuments({
      type: 'easy-return',
      status: { $in: ['new', 'in-progress'] },
    });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching pending count', error: error.message });
  }
};

/**
 * Admin replies to a return request → saves a Contact/Support message for the customer
 * POST /api/returns/:id/reply
 */
exports.replyToReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyMessage, newStatus } = req.body;

    if (!replyMessage || !replyMessage.trim()) {
      return res.status(400).json({ success: false, message: 'Reply message is required.' });
    }

    // Fetch the return request
    const returnRequest = await Return.findOne({ returnId: id });
    if (!returnRequest) {
      return res.status(404).json({ success: false, message: 'Return request not found.' });
    }

    // Update status if a new one was supplied
    const statusToSet = newStatus || returnRequest.status;
    returnRequest.status = statusToSet;
    returnRequest.adminNotes = replyMessage;
    returnRequest.updatedAt = Date.now();
    await returnRequest.save();

    // Resolve decision label
    const statusLabel =
      statusToSet === 'approved'    ? 'Approved'    :
      statusToSet === 'rejected'    ? 'Rejected'    :
      statusToSet === 'in-progress' ? 'In Progress' :
      statusToSet === 'completed'   ? 'Completed'   : 'Under Review';

    // Look up the registered user by email to get userId and verified phone
    const registeredUser = await User.findOne({
      email: returnRequest.email.toLowerCase(),
    }).select('_id phone name');

    const userId       = registeredUser?._id   || null;
    const verifiedPhone = registeredUser?.phone || returnRequest.phone;

    // Build the full message stored in the Support Messages thread
    const subject = `Return Request ${statusLabel} — ${
      returnRequest.orderId ? 'Order #' + returnRequest.orderId : returnRequest.category
    }`;

    const fullMessage =
      `Hello ${returnRequest.name},\n\n` +
      `Your refund request${returnRequest.orderId ? ' for Order #' + returnRequest.orderId : ''} has been reviewed.\n\n` +
      `Status: ${statusLabel}\n\n` +
      `Message from Support:\n${replyMessage}\n\n` +
      `Thank you,\nMani Electricals Support Team`;

    // --- Create a Contact/Support-Messages record ---
    const contactRecord = await Contact.create({
      name:           returnRequest.name,
      email:          returnRequest.email,
      phone:          verifiedPhone,
      subject,
      message:        fullMessage,
      inquiryType:    'Return / Refund',
      status:         'replied',
      replyMessage,
      repliedAt:      new Date(),
      repliedBy:      req.admin?.name || 'Admin',
      // Linkage fields (requirement §2)
      userId,
      orderId:        returnRequest.orderId || null,
      refundDecision: statusLabel,
      returnId:       returnRequest.returnId,
    });

    res.status(200).json({
      success: true,
      message: 'Reply sent and support message created.',
      return: returnRequest,
      contactId: contactRecord._id,
      // Return the verified phone so the frontend can open the correct WhatsApp link
      userPhone: verifiedPhone,
    });
  } catch (error) {
    console.error('Error replying to return:', error);
    res.status(500).json({ success: false, message: 'Error sending reply.', error: error.message });
  }
};

const getReturnForUser = async (returnId, userId) => {
  const user = await User.findById(userId).select('email name').lean();
  if (!user) return { user: null, returnRequest: null };

  const returnRequest = await Return.findOne({ returnId }).lean();
  if (!returnRequest) return { user, returnRequest: null };

  const sameUser = String(returnRequest.email || '').toLowerCase() === String(user.email || '').toLowerCase();
  return { user, returnRequest: sameUser ? returnRequest : null };
};

/**
 * Get refund chat messages for admin
 * GET /api/returns/:id/messages/admin
 */
exports.getReturnMessagesAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const returnRequest = await Return.findOne({ returnId: id }).lean();

    if (!returnRequest) {
      return res.status(404).json({ success: false, message: 'Return request not found.' });
    }

    const messages = await RefundMessage.find({ refundId: id }).sort({ createdAt: 1 }).lean();

    return res.status(200).json({
      success: true,
      returnRequest,
      messages,
      status: returnRequest.status,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get refund chat messages for user
 * GET /api/returns/:id/messages
 */
exports.getReturnMessagesUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { returnRequest } = await getReturnForUser(id, req.user.id);

    if (!returnRequest) {
      return res.status(404).json({ success: false, message: 'Refund conversation not found.' });
    }

    const messages = await RefundMessage.find({ refundId: id }).sort({ createdAt: 1 }).lean();

    return res.status(200).json({
      success: true,
      returnRequest,
      messages,
      status: returnRequest.status,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin sends chat reply in refund conversation
 * POST /api/returns/:id/messages/admin
 */
exports.addReturnMessageAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, newStatus } = req.body || {};
    const trimmedMessage = String(message || '').trim();

    if (!trimmedMessage) {
      return res.status(400).json({ success: false, message: 'Reply message cannot be empty.' });
    }

    const returnRequest = await Return.findOne({ returnId: id });
    if (!returnRequest) {
      return res.status(404).json({ success: false, message: 'Return request not found.' });
    }

    const chatMessage = await RefundMessage.create({
      refundId: id,
      sender: 'ADMIN',
      message: trimmedMessage,
    });

    if (newStatus && ['new', 'in-progress', 'approved', 'rejected', 'completed'].includes(newStatus)) {
      returnRequest.status = newStatus;
    }
    returnRequest.adminNotes = trimmedMessage;
    returnRequest.updatedAt = Date.now();
    await returnRequest.save();

    return res.status(201).json({
      success: true,
      message: 'Reply sent successfully.',
      chatMessage,
      status: returnRequest.status,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * User sends follow-up message in refund conversation
 * POST /api/returns/:id/messages
 */
exports.addReturnMessageUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body || {};
    const trimmedMessage = String(message || '').trim();

    if (!trimmedMessage) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    const { returnRequest } = await getReturnForUser(id, req.user.id);
    if (!returnRequest) {
      return res.status(404).json({ success: false, message: 'Refund conversation not found.' });
    }

    const chatMessage = await RefundMessage.create({
      refundId: id,
      sender: 'USER',
      message: trimmedMessage,
    });

    return res.status(201).json({ success: true, chatMessage });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get current user's cancellation refunds with chat metadata
 * GET /api/returns/my/refunds
 */
exports.getMyRefundReturns = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const myReturns = await Return.find({
      email: user.email,
      type: 'order-cancellation-refund',
    })
      .sort({ createdAt: -1 })
      .lean();

    const returnIds = myReturns.map((entry) => String(entry.returnId || '')).filter(Boolean);
    const messageBuckets = new Map();

    if (returnIds.length > 0) {
      const messages = await RefundMessage.find({ refundId: { $in: returnIds } })
        .sort({ createdAt: 1 })
        .lean();

      messages.forEach((message) => {
        const key = String(message.refundId || '');
        if (!messageBuckets.has(key)) {
          messageBuckets.set(key, []);
        }
        messageBuckets.get(key).push(message);
      });
    }

    const refunds = myReturns.map((entry) => {
      const chat = messageBuckets.get(String(entry.returnId || '')) || [];
      const latestMessage = chat.length > 0 ? chat[chat.length - 1] : null;
      return {
        ...entry,
        messages: chat,
        lastMessage: latestMessage?.message || null,
        lastMessageSender: latestMessage?.sender || null,
        lastMessageAt: latestMessage?.createdAt || null,
      };
    });

    return res.status(200).json({
      success: true,
      refunds,
      count: refunds.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
