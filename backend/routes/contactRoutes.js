const express = require("express");
const {
  getAllContacts,
  getContactById,
  submitContact,
  replyContact,
  markAsRead,
  deleteContact,
  getUnreadCount,
  getCustomerMessages,
} = require("../controllers/contactController");
const { protect, adminProtect, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Public routes (with optional auth to capture userId if logged in)
router.post("/", optionalAuth, submitContact);

// Customer routes (require user authentication)
router.get("/my-messages", protect, getCustomerMessages);

// Admin routes (require admin authentication)
router.get("/", adminProtect, getAllContacts);
router.get("/unread-count", adminProtect, getUnreadCount);
router.get("/:id", adminProtect, getContactById);
router.put("/:id/reply", adminProtect, replyContact);
router.put("/:id/mark-read", adminProtect, markAsRead);
router.delete("/:id", adminProtect, deleteContact);

module.exports = router;
