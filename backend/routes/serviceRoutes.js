const express = require("express");
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require("../controllers/serviceController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.get("/", getAllServices);
router.get("/:id", getServiceById);

// Admin routes
router.post("/", protect, createService);
router.put("/:id", protect, updateService);
router.delete("/:id", protect, deleteService);

module.exports = router;
