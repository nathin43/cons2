# Global Toast Notification System

This document describes the global toast/popup notification system implemented for the e-commerce website.

## Overview

The toast system provides a reusable, professional notification component for displaying success, error, info, and warning messages throughout the application. Toasts automatically dismiss after 2-3 seconds and support multiple notifications stacking neatly.

## Features

✅ **Multiple Toast Types**
- Success (green) - for successful actions
- Error (red) - for errors and failures
- Info (blue) - for informational messages
- Warning (orange) - for warnings and alerts

✅ **Professional Design**
- Rounded corners (12px border radius)
- Soft shadow with backdrop blur
- Smooth fade-in/out animations
- Type-specific icons (checkmark, X, info, triangle)

✅ **User-Friendly Behavior**
- Auto-dismisses after 3 seconds (configurable)
- Manual close button available
- Non-blocking - doesn't interfere with page interaction
- Stacks neatly when multiple toasts appear
- Positioned at top-right corner (floats above content)

✅ **Responsive Design**
- Adapts to mobile devices (320px+)
- Optimized spacing on smaller screens
- Works seamlessly across all breakpoints

✅ **Dark Mode Support**
- Automatically adjusts styling for dark mode preference
- Maintains readability and contrast

## Architecture

### Components and Files

1. **ToastContext** (`src/context/ToastContext.jsx`)
   - React Context for managing global toast state
   - Provides methods: `addToast()`, `removeToast()`, `success()`, `error()`, `info()`, `warning()`

2. **useToast Hook** (`src/hooks/useToast.js`)
   - Custom hook for accessing toast functionality
   - Simplifies usage in components

3. **Toast Component** (`src/components/Toast.jsx`)
   - Individual toast notification component
   - Renders icons based on message type
   - Handles manual close

4. **ToastContainer Component** (`src/components/ToastContainer.jsx`)
   - Container for all active toasts
   - Manages toast rendering and positioning

5. **Toast Styles** (`src/components/Toast.css`)
   - Professional styling with animations
   - Type-specific color schemes
   - Responsive breakpoints

## Usage

### Basic Implementation

1. **Import the hook in your component:**
```javascript
import { useToast } from '../../hooks/useToast';
```

2. **Use the hook:**
```javascript
const { success, error, info, warning } = useToast();
```

3. **Show notifications:**
```javascript
// Success notification (auto-dismisses after 3 seconds)
success('Registration Successful! Please log in.');

// Error notification
error('Email already exists. Please try another email.');

// Info notification
info('Processing your request...');

// Warning notification
warning('This action cannot be undone.');
```

### Advanced Usage

```javascript
// Custom duration (in milliseconds, 0 = no auto-dismiss)
const { addToast } = useToast();

// Show toast for 5 seconds
addToast('Custom message', 'success', 5000);

// Show toast without auto-dismiss
addToast('Click to continue', 'info', 0);

// Get toast ID for manual control
const toastId = addToast('Loading...', 'info', 0);
const { removeToast } = useToast();
removeToast(toastId); // Dismiss manually
```

## Integration Examples

### Login Page Integration

```javascript
import { useToast } from '../../hooks/useToast';

const Login = () => {
  const { success, error } = useToast();
  
  const handleSubmit = async (e) => {
    const result = await login(email, password);
    
    if (result.success) {
      success('Login Successful! Welcome back.');
      setTimeout(() => navigate('/'), 500);
    } else {
      error(result.message);
    }
  };
};
```

### Registration Page Integration

```javascript
const Register = () => {
  const { success, error } = useToast();
  
  const handleSubmit = async (e) => {
    const result = await register(userData);
    
    if (result.success) {
      success('Registration Successful! Please log in to your account.');
      setTimeout(() => navigate('/login'), 500);
    } else {
      error(result.message);
    }
  };
};
```

## Styling Details

### Toast Types and Colors

| Type | Background | Text Color | Icon Color | Border |
|------|-----------|-----------|-----------|--------|
| Success | Green gradient | Dark green | Green | Light green |
| Error | Red gradient | Dark red | Red | Light red |
| Info | Blue gradient | Dark blue | Blue | Light blue |
| Warning | Orange gradient | Dark orange | Orange | Light orange |

### Animations

- **Slide In**: Toasts slide in from the right (0.3s)
- **Slide Out**: Toasts slide out to the right (0.3s)
- **Icons**: Smooth SVG rendering with proper stroke styling

## Configuration

### Provider Setup (Already Done)

The ToastProvider is already integrated in `src/main.jsx`:

```javascript
<ToastProvider>
  <AuthProvider>
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  </AuthProvider>
</ToastProvider>
```

### Container Setup (Already Done)

The ToastContainer is already added to `src/App.jsx`:

```javascript
function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        {/* Routes */}
      </Routes>
    </>
  );
}
```

## Customization

### Changing Position

To change toast position, edit `src/components/Toast.css`:

```css
.toast-container {
  /* Change from top-right to your preferred position */
  top: 20px;        /* vertical position */
  right: 20px;      /* horizontal position */
}
```

### Changing Auto-Dismiss Duration

Default is 3000ms. To change:

```javascript
// In your component
const { success } = useToast();
success('Message', 5000); // Dismisses after 5 seconds
```

### Changing Colors

Edit `src/components/Toast.css`:

```css
.toast-success {
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
  color: #065f46;
  border-color: #d1fae5;
}
```

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 12+, Chrome Mobile 90+)

## Accessibility

- Proper ARIA attributes for screen readers
- Semantic HTML elements
- Keyboard accessible close button
- High contrast ratios for readability

## Best Practices

1. **Keep Messages Short**: Messages should be concise and clear
   ✅ `success('Registration successful!')`
   ❌ `success('Your account has been successfully created and you can now proceed to login')`

2. **Use Appropriate Types**:
   - ✅ `success()` for completed actions
   - ✅ `error()` for failures
   - ✅ `info()` for general information
   - ✅ `warning()` for alerts

3. **Combine with Form Errors**: Keep inline form validation AND use toasts
   ```javascript
   // Still show inline errors
   {validationErrors.email && <span className="error">{validationErrors.email}</span>}
   
   // Also show toast on form submission
   if (!isFormValid()) {
     error('Please fix all validation errors');
   }
   ```

4. **Avoid Toast Spam**: Don't show too many toasts at once
   ✅ Show one notification per critical action
   ❌ Show 5+ toasts for validation messages

5. **Use Timeouts for Navigation**: Add a small delay after showing success toasts
   ```javascript
   success('Action completed!');
   setTimeout(() => navigate('/next-page'), 500);
   ```

## Current Integrations

The toast system has been integrated into:

- ✅ Customer Login Page (`src/pages/customer/Login.jsx`)
- ✅ Customer Register Page (`src/pages/customer/Register.jsx`)
- ✅ Admin Login Page (`src/pages/admin/AdminLogin.jsx`)
- ✅ Google OAuth flows (both customer and admin)

## Future Integration Points

You can extend the toast system to:

- Cart operations (add to cart, remove from cart)
- Order management (place order, cancel order)
- Product reviews (submit review)
- Contact form submissions
- Admin operations (product add/edit/delete, order status updates)
- Profile updates
- Payment confirmations

## Troubleshooting

### Toasts not showing?

1. Ensure `<ToastProvider>` wraps your app in `src/main.jsx`
2. Ensure `<ToastContainer />` is included in `src/App.jsx`
3. Verify you imported `useToast` from the correct path
4. Check browser console for errors

### Toasts showing but in wrong position?

Edit `.toast-container` CSS positioning in `src/components/Toast.css`

### Toasts dismissing too quickly/slowly?

Adjust the duration parameter:
```javascript
success('Message', 5000); // 5 seconds instead of default 3
```

## Performance

- Minimal re-renders: Uses React Context efficiently
- Smooth animations: GPU-accelerated CSS transforms
- Memory efficient: Toasts are removed from DOM when dismissed
- No external dependencies: Pure CSS animations

---

**Version**: 1.0.0  
**Last Updated**: January 21, 2026
