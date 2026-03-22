const express = require("express");
const {
  submitReturn,
  getAllReturns,
  getReturnById,
  updateReturnStatus,
  deleteReturn,
  getPendingCount,
  replyToReturn,
} = require("../controllers/returnController");
const { adminProtect } = require("../middleware/auth");

const router = express.Router();

// Public route — customers submit return requests (no auth required)
router.post("/", submitReturn);

// Admin-only routes — require admin JWT
router.get("/pending-count", adminProtect, getPendingCount);
router.get("/", adminProtect, getAllReturns);
router.get("/:id", adminProtect, getReturnById);
router.put("/:id", adminProtect, updateReturnStatus);
router.post("/:id/reply", adminProtect, replyToReturn);
router.delete("/:id", adminProtect, deleteReturn);

module.exports = router;
