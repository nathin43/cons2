const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Mock products for when database is unavailable
const MOCK_PRODUCTS = {
  '1': { _id: '1', name: 'Wireless Headphones', price: 99.99, stock: 50 },
  '2': { _id: '2', name: 'USB-C Cable', price: 12.99, stock: 100 },
  '3': { _id: '3', name: 'Screen Protector', price: 9.99, stock: 150 },
  '4': { _id: '4', name: 'Phone Case', price: 19.99, stock: 75 }
};

/**
 * Get user's cart - MongoDB Persistent Cart
 * @route GET /api/cart
 * @access Private (Authentication Required)
 * 
 * Returns the persistent cart stored in MongoDB for the authenticated user.
 * Cart persists across sessions until cleared after order placement.
 */
exports.getCart = async (req, res) => {
  try {
    // User must be authenticated - cart is user-specific and persistent
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to access cart'
      });
    }

    // Find cart in database for this user
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

    if (!cart) {
      // Create empty cart for new user
      cart = await Cart.create({
        user: req.user.id,
        items: [],
        totalAmount: 0
      });
    }

    return res.status(200).json({
      success: true,
      cart,
      source: 'database',
      message: 'Persistent cart restored from database'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Add item to cart - MongoDB Persistent Cart
 * @route POST /api/cart/add
 * @access Private (Authentication Required)
 * 
 * Adds/updates an item in the user's persistent MongoDB cart.
 * Cart items are stored with user ID and persist across sessions.
 */
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // User must be authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to add to cart'
      });
    }

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [],
        totalAmount: 0
      });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        price: product.price
      });
    }

    await cart.save();
    await cart.populate('items.product');

    return res.status(200).json({
      success: true,
      message: 'Item added to persistent cart',
      cart,
      source: 'database'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update cart item quantity - MongoDB Persistent Cart
 * @route PUT /api/cart/update
 * @access Private (Authentication Required)
 * 
 * Updates the quantity of an item in the user's persistent MongoDB cart.
 */
exports.updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // User must be authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to update cart'
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Validate stock and product existence
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    // Update quantity and price (in case product price changed)
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.price;
    await cart.save();
    await cart.populate('items.product');

    return res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart,
      source: 'database'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Remove item from cart - MongoDB Persistent Cart
 * @route DELETE /api/cart/remove/:productId
 * @access Private (Authentication Required)
 * 
 * Removes an item from the user's persistent MongoDB cart.
 */
exports.removeFromCart = async (req, res) => {
  try {
    // User must be authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to remove from cart'
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== req.params.productId
    );

    await cart.save();
    await cart.populate('items.product');

    return res.status(200).json({
      success: true,
      message: 'Item removed from persistent cart',
      cart,
      source: 'database'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Clear cart - MongoDB Persistent Cart
 * @route DELETE /api/cart/clear
 * @access Private (Authentication Required)
 * 
 * Clears the user's persistent MongoDB cart.
 * Should only be called after successful order placement or by user request.
 */
exports.clearCart = async (req, res) => {
  try {
    // User must be authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to clear cart'
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Persistent cart cleared',
      cart,
      source: 'database'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
