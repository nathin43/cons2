const express = require("express");
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require("../controllers/serviceController");
const { adminProtect } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.get("/", getAllServices);
router.get("/:id", getServiceById);

// Admin routes
router.post("/", adminProtect, createService);
router.put("/:id", adminProtect, updateService);
router.delete("/:id", adminProtect, deleteService);

module.exports = router;
