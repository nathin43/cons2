import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthProvider.jsx'
import { CartProvider } from './context/CartProvider.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { LoadingProvider } from './context/LoadingContext.jsx'

/**
 * Create router with future flags enabled for React Router v7 compatibility
 * - v7_startTransition: Wraps state updates in React.startTransition
 * - v7_relativeSplatPath: Fixes relative route resolution in splat routes
 */
const router = createBrowserRouter(
  [{ path: '*', element: <App /> }],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <LoadingProvider>
            <RouterProvider router={router} />
          </LoadingProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>,
)
