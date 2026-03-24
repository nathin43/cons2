const express = require("express");
const {
  submitReturn,
  getAllReturns,
  getReturnById,
  updateReturnStatus,
  deleteReturn,
  getPendingCount,
  replyToReturn,
  getReturnMessagesAdmin,
  getReturnMessagesUser,
  addReturnMessageAdmin,
  addReturnMessageUser,
  getMyRefundReturns,
} = require("../controllers/returnController");
const { adminProtect, protect } = require("../middleware/auth");

const router = express.Router();

// Public route — customers submit return requests (no auth required)
router.post("/", submitReturn);

// Customer authenticated routes
router.get("/my/refunds", protect, getMyRefundReturns);
router.get("/:id/messages", protect, getReturnMessagesUser);
router.post("/:id/messages", protect, addReturnMessageUser);

// Admin-only routes — require admin JWT
router.get("/pending-count", adminProtect, getPendingCount);
router.get("/", adminProtect, getAllReturns);
router.get("/:id/messages/admin", adminProtect, getReturnMessagesAdmin);
router.post("/:id/messages/admin", adminProtect, addReturnMessageAdmin);
router.get("/:id", adminProtect, getReturnById);
router.put("/:id", adminProtect, updateReturnStatus);
router.post("/:id/reply", adminProtect, replyToReturn);
router.delete("/:id", adminProtect, deleteReturn);

module.exports = router;
