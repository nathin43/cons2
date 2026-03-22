# Notification Filtering - Quick Start Guide

## 🚀 What's New

The Admin Notification Panel now has **advanced filtering** capabilities allowing admins to filter notifications by:
- **Status**: All / Unread / Read
- **Type**: All Types / Orders / Refunds / Customers / Messages / Stock Alerts

## 📋 Feature Overview

### Filter UI Location
The filter bar appears at the top of the Notification Panel, just below the header.

### Default Behavior
- Default: Shows **All** notifications
- Filters are applied **instantly** when clicked
- Active filters are **highlighted with colored backgrounds**
- A "Clear Filters" button appears when filters are active

## 🔧 API Usage

### Complete Filtering Endpoint
```bash
GET /api/admin/notifications/filter?status=unread&type=orders&limit=50&skip=0
```

### Query Parameter Combinations

| Use Case | URL |
|----------|-----|
| Unread only | `?status=unread` |
| Read only | `?status=read` |
| Order notifications | `?type=orders` |
| Unread orders | `?status=unread&type=orders` |
| Stock alerts | `?type=stock` |
| Refunds | `?type=refunds` |
| Customer notifications | `?type=customers` |
| Messages | `?type=messages` |
| Pagination | `?limit=20&skip=40` |

## 💻 Frontend Integration

### Using the Context Hook
```javascript
import { useNotifications } from '../../context/NotificationContext';

function MyComponent() {
  const {
    notifications,
    filters,
    setStatusFilter,
    setTypeFilter,
    resetFilters,
    fetchFilteredNotifications
  } = useNotifications();

  // Filter to unread notifications
  const handleShowUnread = async () => {
    await setStatusFilter('unread');
  };

  // Filter to order notifications
  const handleShowOrders = async () => {
    await setTypeFilter('orders');
  };

  // Clear all filters
  const handleReset = async () => {
    await resetFilters();
  };

  // Custom filtering with both parameters
  const handleCustomFilter = async () => {
    await fetchFilteredNotifications('unread', 'orders', 50, 0);
  };

  return (
    <div>
      <p>Current Filters: {JSON.stringify(filters)}</p>
      <button onClick={handleShowUnread}>Show Unread</button>
      <button onClick={handleShowOrders}>Show Orders</button>
      <button onClick={handleReset}>Clear Filters</button>
    </div>
  );
}
```

## 🎨 Filter Button Colors

| Filter | Active Color |
|--------|--------------|
| Status | Blue Gradient |
| Type | Green Gradient |
| Clear | Red |

## 📊 Notification Type Mapping

When filtering by type, here's what gets included:

- **Orders**: NEW_ORDER, ORDER_CANCELLED, SALE
- **Refunds**: REFUND_REQUEST
- **Customers**: NEW_CUSTOMER
- **Messages**: CONTACT_MESSAGE
- **Stock**: LOW_STOCK, OUT_OF_STOCK

## 🧪 Testing the Feature

### Manual Test Steps:
1. Log in as admin
2. Click the notification bell icon
3. Click "Unread" button → Should show only unread notifications
4. Click "Orders" button → Should show order-related notifications
5. Combine filters (e.g., unread + orders)
6. Click "Clear Filters" → Should reset to all notifications
7. Verify the notification list updates instantly

### Browser Console Testing:
```javascript
// Open admin notification panel
// Go to browser console and test:

const { fetchFilteredNotifications, setStatusFilter, setTypeFilter } = 
  ReactDOM._internalRoot.current.child.memoizedProps.value;

// Test unread filter
await setStatusFilter('unread');

// Test order filter
await setTypeFilter('orders');

// Test combination
await fetchFilteredNotifications('unread', 'orders');
```

## 🔍 Performance Notes

- Filters work instantly thanks to client-side context state
- Backend API is optimized with MongoDB indexes
- Pagination is supported for large result sets
- Unread count is always accurate

## ✅ Checklist for Integration

- [ ] Backend server is running
- [ ] Frontend is built/running in development mode
- [ ] Admin is logged in
- [ ] Notification panel opens correctly
- [ ] Filter bar is visible below the "Notifications" header
- [ ] All filter buttons are clickable
- [ ] Filters update the notification list
- [ ] Clear Filters button works
- [ ] Mobile responsive design works

## 🐛 Troubleshooting

### Filters not appearing
- Clear browser cache and reload
- Verify NotificationFilterBar.jsx is imported in NotificationPanel.jsx
- Check console for any component errors

### API returning 404
- Ensure `/api/admin/notifications/filter` route is registered
- Verify adminProtect middleware is applied
- Check that your admin token is valid

### Filters not updating notifications
- Check Network tab in DevTools for API responses
- Verify filter parameters are being sent correctly
- Check if useNotifications context is properly initialized

### Styling issues
- Verify NotificationFilterBar.css is imported
- Check if CSS file is in the correct location
- Clear cache and hard refresh (Ctrl+Shift+R)

## 📚 Related Files

Backend:
- `backend/services/notificationService.js` - Filter logic
- `backend/controllers/notificationController.js` - API endpoints
- `backend/routes/notificationRoutes.js` - Route configuration

Frontend:
- `frontend/src/context/NotificationContext.jsx` - State management
- `frontend/src/components/admin/NotificationFilterBar.jsx` - Filter component
- `frontend/src/components/admin/NotificationFilterBar.css` - Styles
- `frontend/src/components/admin/NotificationPanel.jsx` - Main panel

## 🎯 Common Use Cases

### Use Case 1: Show me only unread messages
1. Click "Unread" status filter
2. Click "Messages" type filter
3. See only unread contact messages

### Use Case 2: Check recent orders
1. Click "All" status filter
2. Click "Orders" type filter
3. See all order-related notifications (new, cancelled, sales)

### Use Case 3: Review pending refunds
1. Click "Unread" status filter
2. Click "Refunds" type filter
3. See only unread refund requests

### Use Case 4: Inventory alerts
1. Click "All" status filter
2. Click "Stock Alerts" type filter
3. See stock warnings and out-of-stock alerts

## 📞 Support

For issues or questions, check the implementation summary at:
`NOTIFICATION_FILTERING_IMPLEMENTATION.md`
