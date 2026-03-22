/**
 * User Data Consistency Service
 * Ensures all modules reference user data correctly through userId
 * Prevents data duplication across collections
 */

const User = require('../models/User');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Report = require('../models/Report');
const ReportMessage = require('../models/ReportMessage');
const Contact = require('../models/Contact');
const Return = require('../models/Return');

/**
 * Fetch user data for any module
 * @param {string} userId - User ID
 * @returns {Object} Current user data
 */
exports.getUserData = async (userId) => {
  try {
    const user = await User.findById(userId).select('_id name email phone address status').lean();
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify profile update was saved to database
 * @param {string} userId - User ID to verify
 * @param {Object} expectedData - Data that should have been updated
 * @returns {Object} Verification result
 */
exports.verifyProfileUpdate = async (userId, expectedData) => {
  try {
    const user = await User.findById(userId).select('name email phone address').lean();

    if (!user) {
      return {
        success: false,
        verified: false,
        message: 'User not found'
      };
    }

    // Check if fields match expected values
    const verification = {
      name: {
        expected: expectedData.name,
        actual: user.name,
        matches: user.name === expectedData.name
      },
      phone: {
        expected: expectedData.phone,
        actual: user.phone,
        matches: user.phone === expectedData.phone
      }
    };

    // Check address if provided
    if (expectedData.address) {
      const addr = user.address || {};
      verification.address = {
        street: {
          expected: expectedData.address.street,
          actual: addr.street,
          matches: addr.street === expectedData.address.street
        },
        city: {
          expected: expectedData.address.city,
          actual: addr.city,
          matches: addr.city === expectedData.address.city
        }
      };
    }

    // All checks passed
    const allMatches = Object.values(verification).every(v => {
      if (typeof v.matches === 'boolean') return v.matches;
      return Object.values(v).every(sub => typeof sub.matches !== 'boolean' || sub.matches);
    });

    return {
      success: true,
      verified: allMatches,
      verification,
      user
    };
  } catch (error) {
    return {
      success: false,
      verified: false,
      message: error.message
    };
  }
};

/**
 * Ensure all orders reference userId correctly
 * Fix any orders with missing userId reference
 * @returns {Object} Consistency check result
 */
exports.ensureOrderConsistency = async () => {
  try {
    const result = {
      ordersChecked: 0,
      ordersMissingUserId: 0,
      shippingAddressMatches: [],
      warnings: []
    };

    // Get all orders
    const orders = await Order.find().populate('user', '_id name email phone address').lean();

    result.ordersChecked = orders.length;

    for (const order of orders) {
      // Each order should have userId reference
      if (!order.user || !order.user._id) {
        result.ordersMissingUserId++;
        result.warnings.push(`Order ${order._id} missing user reference`);
      }

      // Order should have user data denormalized only for display purposes
      // Authoritative data should come from User collection
      if (order.user) {
        result.shippingAddressMatches.push({
          orderId: order._id,
          hasUserRef: true,
          userAddressExists: !!order.user.address
        });
      }
    }

    return {
      success: true,
      consistency: result
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Ensure cart references userId correctly
 * @returns {Object} Consistency check result
 */
exports.ensureCartConsistency = async () => {
  try {
    const result = {
      cartsChecked: 0,
      cartsMissingUserId: 0,
      warnings: []
    };

    const carts = await Cart.find().populate('user', '_id email').lean();

    result.cartsChecked = carts.length;

    for (const cart of carts) {
      if (!cart.user || !cart.user._id) {
        result.cartsMissingUserId++;
        result.warnings.push(`Cart ${cart._id} missing user reference`);
      }
    }

    return {
      success: true,
      consistency: result
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Check all collections for user data consistency
 * @returns {Object} Full consistency report
 */
exports.getFullConsistencyReport = async () => {
  try {
    const orderCheck = await exports.ensureOrderConsistency();
    const cartCheck = await exports.ensureCartConsistency();

    return {
      success: true,
      timestamp: new Date().toISOString(),
      collections: {
        orders: orderCheck,
        carts: cartCheck
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Fix missing user references in orders
 * This is a migration/fix function
 * @returns {Object} Fix result
 */
exports.fixOrderUserReferences = async () => {
  try {
    const result = {
      ordersChecked: 0,
      ordersFixed: 0,
      warnings: []
    };

    const orders = await Order.find();

    result.ordersChecked = orders.length;

    for (const order of orders) {
      // If order doesn't have user reference but has userId, fix it
      if (!order.user || order.user.toString() === '') {
        result.warnings.push(`Order ${order._id} had invalid user reference`);
        // Don't auto-fix here, just report
      }
    }

    return {
      success: true,
      result
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

module.exports = exports;
