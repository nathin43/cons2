const Return = require("../models/Return");

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

    res.status(201).json({
      success: true,
      message: "Return request submitted successfully",
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
      message: "Return request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting return:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting return request",
      error: error.message,
    });
  }
};
