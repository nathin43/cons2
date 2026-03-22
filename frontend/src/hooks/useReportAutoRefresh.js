import { useEffect, useRef } from 'react';

const useReportAutoRefresh = (refreshFn, options = {}) => {
  const { intervalMs = 10000, enabled = true } = options;
  const refreshRef = useRef(refreshFn);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    refreshRef.current = refreshFn;
  }, [refreshFn]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return undefined;
    }

    const runRefresh = async () => {
      if (isRefreshingRef.current || typeof refreshRef.current !== 'function') {
        return;
      }

      isRefreshingRef.current = true;
      try {
        await refreshRef.current();
      } finally {
        isRefreshingRef.current = false;
      }
    };

    const intervalId = window.setInterval(runRefresh, intervalMs);
    const handleFocus = () => runRefresh();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        runRefresh();
      }
    };
    const handleDataChanged = () => runRefresh();

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('report:data-changed', handleDataChanged);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('report:data-changed', handleDataChanged);
    };
  }, [enabled, intervalMs]);
};

export default useReportAutoRefresh;
