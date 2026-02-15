const express = require("express");
const {
  submitReturn,
  getAllReturns,
  getReturnById,
  updateReturnStatus,
  deleteReturn,
} = require("../controllers/returnController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/", submitReturn);

// Admin routes
router.get("/", protect, getAllReturns);
router.get("/:id", protect, getReturnById);
router.put("/:id", protect, updateReturnStatus);
router.delete("/:id", protect, deleteReturn);

module.exports = router;
