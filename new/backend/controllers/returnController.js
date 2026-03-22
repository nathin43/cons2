const Return = require("../models/Return");
const Contact = require("../models/Contact");
const User = require("../models/User");
const Admin = require('../models/Admin');
const Order = require('../models/Order');
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
    const returns = await Return.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      returns,
      count: returns.length,
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

    const returnRequest = await Return.findOneAndUpdate(
      { returnId: id },
      {
        status,
        adminNotes: adminNotes || "",
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
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
    const count = await Return.countDocuments({ status: { $in: ['new', 'in-progress'] } });
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
