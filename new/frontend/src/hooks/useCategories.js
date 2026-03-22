import { useState, useEffect } from 'react';
import API from '../services/api';

/**
 * useCategories
 * Fetches category pricing (GST % + shipping ₹) from the server once per mount.
 * Returns a map keyed by category name that can be passed to calculateOrderTotals().
 *
 * Example returned map:
 *   { "Fan": { gstPercent: 18, shipping: 80 }, ... }
 *
 * While loading, the map is empty `{}` — calculateOrderTotals() will fall back
 * to its hardcoded defaults, so the UI is never broken.
 */
const useCategories = () => {
  const [categoriesMap, setCategoriesMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    API.get('/categories')
      .then(({ data }) => {
        if (!cancelled && data.success && Array.isArray(data.categories)) {
          const map = {};
          data.categories.forEach(cat => {
            map[cat.name] = { gstPercent: cat.gst, shipping: cat.shipping };
          });
          setCategoriesMap(map);
        }
      })
      .catch(() => {
        // Non-critical: hardcoded fallback will be used if fetch fails
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { categoriesMap, loading };
};

export default useCategories;
