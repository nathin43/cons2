const Product = require('../models/Product');
const path = require('path');
const UserNotificationService = require('../services/userNotificationService');
const {
  specificationSchemas,
  getSpecificationSchema,
  getCategories,
  validateSpecifications,
  getSpecLabel
} = require('../config/specificationSchemas');
const { processProductImages, processProductsImages } = require('../utils/imageUrl');

// Mock data for fallback when database is unavailable
const MOCK_PRODUCTS = [
  {
    _id: '1',
    name: 'Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 99.99,
    category: 'Audio',
    brand: 'TechBrand',
    stock: 50,
    image: '/uploads/products/headphones.jpg',
    featured: true,
    status: 'active'
  },
  {
    _id: '2',
    name: 'USB-C Cable',
    description: 'Fast charging USB-C cable',
    price: 12.99,
    category: 'Cables',
    brand: 'TechBrand',
    stock: 100,
    image: '/uploads/products/usb-cable.jpg',
    featured: true,
    status: 'active'
  },
  {
    _id: '3',
    name: 'Screen Protector',
    description: 'Tempered glass screen protector',
    price: 9.99,
    category: 'Accessories',
    brand: 'ScreenGuard',
    stock: 150,
    image: '/uploads/products/protector.jpg',
    featured: true,
    status: 'active'
  },
  {
    _id: '4',
    name: 'Phone Case',
    description: 'Durable protective phone case',
    price: 19.99,
    category: 'Accessories',
    brand: 'CaseWorks',
    stock: 75,
    image: '/uploads/products/case.jpg',
    featured: false,
    status: 'active'
  }
];

/**
 * Get all products with filtering, sorting, and pagination
 * @route GET /api/products
 * @access Public
 */
exports.getProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, page = 1, limit = 12, status } = req.query;

    // Try to fetch from database
    try {
      // Build query
      let query = {};

      // Status filter
      // For public/customer view (status=active), also include low-stock products
      // so customers can still see and buy products with limited inventory
      if (status && status !== 'all') {
        if (status === 'active') {
          query.status = { $in: ['active', 'low-stock'] };
        } else {
          query.status = status;
        }
      }

      // Category filter
      if (category && category !== 'all') {
        query.category = category;
      }

      // Search filter - use text search for better performance
      if (search) {
        query.$text = { $search: search };
      }

      // Price filter
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }

      // Sorting
      let sortOption = {};
      if (sort === 'price-asc') {
        sortOption.price = 1;
      } else if (sort === 'price-desc') {
        sortOption.price = -1;
      } else if (sort === 'name') {
        sortOption.name = 1;
      } else if (search) {
        // If searching text, sort by relevance score by default
        sortOption.score = { $meta: 'textScore' };
      } else {
        sortOption.createdAt = -1; // Default: newest first
      }

      // Pagination
      const skip = (page - 1) * limit;

      // Execute query with .lean() for performance
      let queryChain = Product.find(query);
      
      // Add score projection if using text search
      if (search) {
        queryChain = queryChain.select({ score: { $meta: 'textScore' } });
      }

      const products = await queryChain
        .sort(sortOption)
        .limit(Number(limit))
        .skip(skip)
        .lean(); // Return plain objects for better performance

      // Get total count for pagination
      const total = await Product.countDocuments(query);

      // Process products to add full image URLs
      const processedProducts = processProductsImages(products);

      return res.status(200).json({
        success: true,
        count: processedProducts.length,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
        products: processedProducts,
        source: 'database'
      });
    } catch (dbError) {
      console.warn('Database query failed, using mock data:', dbError.message);
      
      // Fallback to mock data
      let filteredProducts = [...MOCK_PRODUCTS];

      // Category filter
      if (category && category !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filteredProducts = filteredProducts.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.brand.toLowerCase().includes(searchLower)
        );
      }

      // Price filter
      if (minPrice || maxPrice) {
        filteredProducts = filteredProducts.filter(p => {
          if (minPrice && p.price < Number(minPrice)) return false;
          if (maxPrice && p.price > Number(maxPrice)) return false;
          return true;
        });
      }

      // Sorting
      if (sort === 'price-asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
      } else if (sort === 'price-desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
      } else if (sort === 'name') {
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Pagination
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;
      const paginatedProducts = filteredProducts.slice(skip, skip + limitNum);
      const total = filteredProducts.length;

      // Process products to add full image URLs
      const processedProducts = processProductsImages(paginatedProducts);

      return res.status(200).json({
        success: true,
        count: processedProducts.length,
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        products: processedProducts,
        source: 'mock-data',
        message: 'Database unavailable - showing sample products'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get single product by ID
 * @route GET /api/products/:id
 * @access Public
 */
exports.getProduct = async (req, res) => {
  try {
    // Try database first
    try {
      const product = await Product.findById(req.params.id);
      if (product) {
        console.log('✅ Product found in database:', {
          id: product._id,
          name: product.name,
          category: product.category,
          hasSpecifications: !!product.specifications,
          specificationsType: typeof product.specifications,
          specifications: product.specifications,
          specsKeys: product.specifications ? Object.keys(product.specifications) : []
        });
        
        // Process product to add full image URL
        const processedProduct = processProductImages(product);
        
        return res.status(200).json({
          success: true,
          product: processedProduct,
          source: 'database'
        });
      }
    } catch (dbError) {
      console.warn('Database query failed, checking mock data:', dbError.message);
    }

    // Fallback to mock data
    const product = MOCK_PRODUCTS.find(p => p._id === req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Process product to add full image URL
    const processedProduct = processProductImages(product);

    res.status(200).json({
      success: true,
      product: processedProduct,
      source: 'mock-data'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get featured products
 * @route GET /api/products/featured
 * @access Public
 */
exports.getFeaturedProducts = async (req, res) => {
  try {
    // Try database first
    try {
      const products = await Product.find({ featured: true, status: { $in: ['active', 'low-stock'] } })
        .limit(8)
        .sort('-createdAt');
      
      if (products && products.length > 0) {
        // Process products to add full image URLs
        const processedProducts = processProductsImages(products);
        
        return res.status(200).json({
          success: true,
          count: processedProducts.length,
          products: processedProducts,
          source: 'database'
        });
      }
    } catch (dbError) {
      console.warn('Database query failed, using mock data:', dbError.message);
    }

    // Fallback to mock data
    const products = MOCK_PRODUCTS.filter(p => p.featured && p.status === 'active');
    
    // Process products to add full image URLs
    const processedProducts = processProductsImages(products);
    
    res.status(200).json({
      success: true,
      count: processedProducts.length,
      products: processedProducts,
      source: 'mock-data',
      message: 'Database unavailable - showing sample featured products'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all categories
 * @route GET /api/products/categories/all
 * @access Public
 */
exports.getCategories = async (req, res) => {
  try {
    // Try database first
    try {
      const categories = await Product.distinct('category');
      if (categories && categories.length > 0) {
        return res.status(200).json({
          success: true,
          categories,
          source: 'database'
        });
      }
    } catch (dbError) {
      console.warn('Database query failed, using mock data:', dbError.message);
    }

    // Fallback to mock data
    const categories = [...new Set(MOCK_PRODUCTS.map(p => p.category))];
    
    res.status(200).json({
      success: true,
      categories,
      source: 'mock-data',
      message: 'Database unavailable - showing sample categories'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Create new product (Admin only)
 * @route POST /api/products
 * @access Private/Admin
 */
exports.createProduct = async (req, res) => {
  try {
    // Handle main image (from uploadProductImages fields middleware)
    let imagePath = '';
    if (req.files && req.files['image'] && req.files['image'][0]) {
      imagePath = `/uploads/products/${req.files['image'][0].filename}`;
    } else if (req.file) {
      // fallback for single upload middleware
      imagePath = `/uploads/products/${req.file.filename}`;
    }

    // Handle gallery images
    let galleryImages = [];
    if (req.files && req.files['images']) {
      galleryImages = req.files['images'].map(f => `/uploads/products/${f.filename}`);
    }

    // Parse specifications if it's a JSON string
    if (req.body.specifications && typeof req.body.specifications === 'string') {
      try {
        req.body.specifications = JSON.parse(req.body.specifications);
        console.log('✅ Parsed specifications from JSON (create):', req.body.specifications);
      } catch (e) {
        console.error('❌ Failed to parse specifications (create):', e);
        req.body.specifications = {};
      }
    }

    console.log('✅ Creating product with specifications:', {
      name: req.body.name,
      category: req.body.category,
      specificationsType: typeof req.body.specifications,
      specifications: req.body.specifications,
      specsKeys: req.body.specifications ? Object.keys(req.body.specifications) : []
    });

    const productData = {
      ...req.body,
      image: imagePath || req.body.image,
      images: galleryImages
    };

    const product = await Product.create(productData);

    console.log('✅ Product created successfully, specs saved as:', {
      specifications: product.specifications,
      specsKeys: product.specifications ? Object.keys(product.specifications) : []
    });

    // Process product to add full image URL
    const processedProduct = processProductImages(product);

    // Broadcast new-product notification to all users (fire-and-forget)
    UserNotificationService.broadcastNewProduct(product._id, product.name).catch((err) =>
      console.error('broadcastNewProduct error (non-fatal):', err.message)
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: processedProduct
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update product (Admin only)
 * @route PUT /api/products/:id
 * @access Private/Admin
 */
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Handle main image replacement
    if (req.files && req.files['image'] && req.files['image'][0]) {
      req.body.image = `/uploads/products/${req.files['image'][0].filename}`;
    } else if (req.file) {
      req.body.image = `/uploads/products/${req.file.filename}`;
    }

    // Handle gallery images merge:
    // existingImages = JSON array of kept image URLs sent from frontend
    // newImages = newly uploaded gallery files
    let keptImages = [];
    if (req.body.existingImages) {
      try {
        keptImages = JSON.parse(req.body.existingImages);
      } catch (e) {
        keptImages = [];
      }
    } else {
      // If not sent, preserve existing gallery
      keptImages = product.images || [];
    }
    const newGalleryImages = req.files && req.files['images']
      ? req.files['images'].map(f => `/uploads/products/${f.filename}`)
      : [];
    req.body.images = [...keptImages, ...newGalleryImages];

    // Parse specifications if it's a JSON string
    if (req.body.specifications && typeof req.body.specifications === 'string') {
      try {
        req.body.specifications = JSON.parse(req.body.specifications);
        console.log('✅ Parsed specifications from JSON:', req.body.specifications);
      } catch (e) {
        console.error('❌ Failed to parse specifications:', e);
        req.body.specifications = {};
      }
    }

    console.log('✅ Updating product with specifications:', {
      productId: req.params.id,
      category: req.body.category,
      specificationsType: typeof req.body.specifications,
      specifications: req.body.specifications,
      specsKeys: req.body.specifications ? Object.keys(req.body.specifications) : []
    });

    // Auto-calculate stock-based status (mirrors pre-save hook,
    // needed here because findByIdAndUpdate bypasses Mongoose middleware)
    if (req.body.stock !== undefined && req.body.status !== 'inactive') {
      const stockNum = Number(req.body.stock);
      if (stockNum === 0) {
        req.body.status = 'out-of-stock';
      } else if (stockNum <= 10) {
        req.body.status = 'low-stock';
      } else if (req.body.status === 'out-of-stock' || req.body.status === 'low-stock') {
        req.body.status = 'active';
      } else if (!req.body.status) {
        // Restore from auto-statuses when stock is refilled
        if (product.status === 'out-of-stock' || product.status === 'low-stock') {
          req.body.status = 'active';
        }
      }
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    console.log('✅ Product updated successfully, specs are now:', {
      specifications: product.specifications,
      specsKeys: product.specifications ? Object.keys(product.specifications) : []
    });

    // Process product to add full image URL
    const processedProduct = processProductImages(product);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: processedProduct
    });
  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete product (Admin only)
 * @route DELETE /api/products/:id
 * @access Private/Admin
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Toggle product status (Admin only)
 * @route PATCH /api/products/:id/status
 * @access Private/Admin
 */
exports.toggleProductStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status value — only allow admin toggle between active and inactive;
    // 'low-stock' and 'out-of-stock' are auto-managed by the pre-save hook
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Toggle accepts: active or inactive'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update only the status field
    product.status = status;
    await product.save();

    // Process product to add full image URL
    const processedProduct = processProductImages(product);

    res.status(200).json({
      success: true,
      message: `Product status updated to ${status}`,
      product: processedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get specification schemas for all categories
 * @route GET /api/products/specifications/schemas
 * @access Public
 */
exports.getSpecificationSchemas = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      schemas: specificationSchemas,
      categories: getCategories()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get specification schema for a specific category
 * @route GET /api/products/specifications/schemas/:category
 * @access Public
 */
exports.getCategorySpecificationSchema = async (req, res) => {
  try {
    const { category } = req.params;
    const schema = getSpecificationSchema(category);
    
    res.status(200).json({
      success: true,
      category,
      schema
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

