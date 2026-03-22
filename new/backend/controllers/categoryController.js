const Category = require('../models/Category');
const { calculateOrderTotals } = require('../utils/pricingUtils');
const Product = require('../models/Product');

/**
 * GET /api/categories
 * Public — returns all categories with their GST and shipping values.
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort('name');
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/categories/:id
 * Admin only — update GST % and/or shipping charge for a category.
 */
exports.updateCategory = async (req, res) => {
  try {
    const { gst, shipping } = req.body;

    const update = {};
    if (gst !== undefined) {
      const parsed = Number(gst);
      if (isNaN(parsed) || parsed < 0 || parsed > 100) {
        return res.status(400).json({ success: false, message: 'GST must be between 0 and 100' });
      }
      update.gst = parsed;
    }
    if (shipping !== undefined) {
      const parsed = Number(shipping);
      if (isNaN(parsed) || parsed < 0) {
        return res.status(400).json({ success: false, message: 'Shipping charge must be 0 or more' });
      }
      update.shipping = parsed;
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.status(200).json({
      success: true,
      message: `Category "${category.name}" updated`,
      category
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/cart/calculate
 * Authenticated — calculate subtotal, GST, shipping and total for a list of
 * cart items using live category values from the database.
 *
 * Request body:
 *   { items: [{ productId, quantity }] }
 *
 * Response:
 *   { subtotal, gst, shipping, total }
 */
exports.calculateCart = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    // Fetch products + live category pricing in parallel
    const [products, categoriesDocs] = await Promise.all([
      Product.find({ _id: { $in: items.map(i => i.productId || i.product) } }),
      Category.find()
    ]);

    // Build a quick lookup map: categoryName → { gst, shipping }
    const catMap = {};
    categoriesDocs.forEach(c => {
      catMap[c.name] = { gstPercent: c.gst, shipping: c.shipping };
    });

    // Build enriched items array
    const enriched = items.map(item => {
      const product = products.find(p => p._id.toString() === (item.productId || item.product).toString());
      if (!product) return null;
      return {
        price: product.price,
        quantity: item.quantity || 1,
        category: product.category || 'Other'
      };
    }).filter(Boolean);

    const totals = calculateOrderTotals(enriched, catMap);

    res.status(200).json({ success: true, ...totals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
