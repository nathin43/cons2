/**
 * pricingUtils.js — Mani Electricals Backend
 * Mirrors frontend/src/utils/pricingUtils.js — keep both in sync.
 *
 * Category → GST % and flat shipping charge (₹)
 */

const CATEGORY_PRICING = {
  'Fan':           { gstPercent: 18, shipping: 80  },
  'Lights':        { gstPercent: 12, shipping: 50  },
  'Motors':        { gstPercent: 18, shipping: 100 },
  'Pipes':         { gstPercent: 18, shipping: 50  },
  'Switches':      { gstPercent: 18, shipping: 40  },
  'Tank':          { gstPercent: 18, shipping: 150 },
  'Water Heater':  { gstPercent: 18, shipping: 100 },
  'Wire & Cables': { gstPercent: 18, shipping: 60  },
  // Aliases
  'Heater':        { gstPercent: 18, shipping: 100 },
  'Other':         { gstPercent: 18, shipping: 60  },
};

const DEFAULT_PRICING = { gstPercent: 18, shipping: 60 };

const getCategoryPricing = (category) =>
  CATEGORY_PRICING[category] || DEFAULT_PRICING;

/**
 * calculateOrderTotals
 *
 * @param {Array}  items         Each item must have: { price, quantity, category }
 * @param {Object} [categoriesMap]  Optional live map from DB:
 *                               { "Fan": { gstPercent: 18, shipping: 80 }, ... }
 *                               Falls back to hardcoded CATEGORY_PRICING when omitted.
 * @returns {{ subtotal, gst, shipping, total }}
 *
 * Shipping is charged once per distinct category.
 */
const calculateOrderTotals = (items, categoriesMap = null) => {
  if (!items || items.length === 0) {
    return { subtotal: 0, gst: 0, shipping: 0, total: 0 };
  }

  // Use live DB map when provided, otherwise fall back to hardcoded values
  const getRule = (category) => {
    if (categoriesMap && categoriesMap[category]) return categoriesMap[category];
    return getCategoryPricing(category);
  };

  let subtotal = 0;
  let gst = 0;
  const seenCategories = new Set();

  items.forEach((item) => {
    const price    = item.price    || 0;
    const qty      = item.quantity || 1;
    const category = item.category || 'Other';
    const { gstPercent } = getRule(category);

    const lineSubtotal = price * qty;
    subtotal += lineSubtotal;
    gst      += lineSubtotal * (gstPercent / 100);
    seenCategories.add(category);
  });

  let shipping = 0;
  seenCategories.forEach((cat) => {
    shipping += getRule(cat).shipping;
  });

  const total = subtotal + gst + shipping;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    gst:      Math.round(gst      * 100) / 100,
    shipping,
    total:    Math.round(total    * 100) / 100,
  };
};

module.exports = { CATEGORY_PRICING, getCategoryPricing, calculateOrderTotals };
