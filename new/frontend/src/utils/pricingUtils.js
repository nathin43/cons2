/**
 * pricingUtils.js — Mani Electricals
 * Category-based GST and shipping calculation engine.
 *
 * GST rates and shipping charges per product category:
 *   Fan          → 18% GST, ₹80  shipping
 *   Lights       → 12% GST, ₹50  shipping
 *   Motors       → 18% GST, ₹100 shipping
 *   Pipes        → 18% GST, ₹50  shipping
 *   Switches     → 18% GST, ₹40  shipping
 *   Tank         → 18% GST, ₹150 shipping
 *   Water Heater → 18% GST, ₹100 shipping
 *   Wire & Cables→ 18% GST, ₹60  shipping
 */

// Per-category GST % and flat shipping charge (in ₹)
export const CATEGORY_PRICING = {
  'Fan':           { gstPercent: 18, shipping: 80  },
  'Lights':        { gstPercent: 12, shipping: 50  },
  'Motors':        { gstPercent: 18, shipping: 100 },
  'Pipes':         { gstPercent: 18, shipping: 50  },
  'Switches':      { gstPercent: 18, shipping: 40  },
  'Tank':          { gstPercent: 18, shipping: 150 },
  'Water Heater':  { gstPercent: 18, shipping: 100 },
  'Wire & Cables': { gstPercent: 18, shipping: 60  },
  // Aliases / other categories
  'Heater':        { gstPercent: 18, shipping: 100 },
  'Other':         { gstPercent: 18, shipping: 60  },
};

const DEFAULT_PRICING = { gstPercent: 18, shipping: 60 };

/**
 * Look up pricing rules for a category.
 * Falls back to DEFAULT_PRICING for unknown categories.
 */
export const getCategoryPricing = (category) =>
  CATEGORY_PRICING[category] || DEFAULT_PRICING;

/**
 * calculateOrderTotals
 *
 * Computes subtotal, GST, shipping and final total for an array of cart items.
 * Shipping is charged once per unique product category present in the items.
 *
 * @param {Array}  items          — cart items, each with shape:
 *   { product: { category, price, ... }, price?, quantity }
 * @param {Object} [categoriesMap] — optional live map fetched from DB:
 *   { "Fan": { gstPercent: 18, shipping: 80 }, ... }
 *   When provided, DB values take priority over hardcoded CATEGORY_PRICING.
 *
 * @returns {{ subtotal, gst, shipping, total }}
 *   All values are numbers rounded to 2 decimal places.
 */
export const calculateOrderTotals = (items, categoriesMap = null) => {
  if (!items || items.length === 0) {
    return { subtotal: 0, gst: 0, shipping: 0, total: 0 };
  }

  // Resolve pricing rule: live DB map → hardcoded fallback
  const getRule = (category) => {
    if (categoriesMap && categoriesMap[category]) return categoriesMap[category];
    return getCategoryPricing(category);
  };

  let subtotal = 0;
  let gst = 0;
  const seenCategories = new Set();

  items.forEach((item) => {
    const price    = item.price || item.product?.price || 0;
    const qty      = item.quantity || 1;
    const category = item.product?.category || item.category || 'Other';
    const { gstPercent } = getRule(category);

    const lineSubtotal = price * qty;
    subtotal += lineSubtotal;
    gst      += lineSubtotal * (gstPercent / 100);

    seenCategories.add(category);
  });

  // One shipping charge per distinct category, not per item
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
