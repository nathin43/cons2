import { useState, useCallback } from 'react';

/**
 * useAdminLoader
 * ─────────────────────────────────────────────────────────────────
 * Shared loading hook used by EVERY admin page.
 *
 * Guarantees:
 *  • Loader is shown for a minimum of LOADER_MIN_MS milliseconds,
 *    matching the Dashboard's perceived load time exactly.
 *  • If the API responds faster than LOADER_MIN_MS the loader keeps
 *    spinning until the minimum time has elapsed (no flicker).
 *  • If the API is slower the loader stays until data arrives.
 *
 * Animation timing (in sync with DashboardSkeleton.css):
 *  LOADER_MIN_MS  : 2000 ms  (2 s minimum display)
 *  fadeIn         : 0.3 s
 *  scaleIn        : 0.4 s
 *  spinRotate     : 1.5 s infinite
 *  spinReverse    : 1.2 s infinite
 *  pulse          : 2 s infinite
 *  bounce         : 1.4 s infinite
 *
 * Usage:
 *   const { loading, run } = useAdminLoader();
 *   // inside useEffect:
 *   run(() => API.get('/endpoint').then(({ data }) => setState(data)));
 */

export const LOADER_MIN_MS = 2000;

const useAdminLoader = () => {
  const [loading, setLoading] = useState(true);

  /**
   * run(asyncCallback)
   *
   * Wraps an async function so that:
   *  1. loading = true immediately
   *  2. Both the callback AND a minimum-delay promise run in parallel
   *  3. loading = false only after BOTH finish
   */
  const run = useCallback(async (asyncCallback) => {
    setLoading(true);
    const minDelay = new Promise((resolve) => setTimeout(resolve, LOADER_MIN_MS));
    try {
      await Promise.all([asyncCallback(), minDelay]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, setLoading, run };
};

export default useAdminLoader;
