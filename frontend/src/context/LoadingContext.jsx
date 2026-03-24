import { createContext, useContext, useState, useCallback } from 'react';

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
  const [state, setState] = useState({ visible: false, message: 'Loading...' });

  const showLoader = useCallback((message = 'Loading...') => {
    setState({ visible: true, message });
  }, []);

  const hideLoader = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <LoadingContext.Provider value={{ ...state, showLoader, hideLoader }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error('useLoading must be used inside <LoadingProvider>');
  }
  return ctx;
};

export default LoadingContext;
