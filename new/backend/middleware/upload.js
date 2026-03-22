const multer = require('multer');
const path = require('path');

/**
 * Configure multer for file uploads
 * Handles product image uploads with validation
 */

// Storage configuration
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/products/');
  },
  filename: function(req, file, cb) {
    // Use product name (slugified) + timestamp for traceability
    const rawName = (req.body && req.body.name) ? req.body.name : 'product';
    const slug = rawName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    cb(null, `${slug}-${Date.now()}${path.extname(file.originalname).toLowerCase()}`);
  }
});

// File filter - Accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

// Multi-field upload: main image + up to 5 gallery images
const uploadProductImages = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 5 }
]);

module.exports = upload;
module.exports.uploadProductImages = uploadProductImages;
