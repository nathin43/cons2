# Notification Filtering - Testing Guide

## Pre-Testing Checklist

Before running tests, ensure:
- [ ] Backend server is running (`npm start` or `node server.js`)
- [ ] Frontend is running (`npm run dev` or similar)
- [ ] MongoDB is connected and running
- [ ] You're logged in as an admin user
- [ ] Browser DevTools are open (F12)

## Unit Testing

### 1. Backend Service Tests

**File**: `backend/services/notificationService.js`

```javascript
// Test getFilteredNotifications
const NotificationService = require('./services/notificationService');
const testAdminId = 'YOUR_ADMIN_ID';

// Test 1: Get all notifications
const result1 = await NotificationService.getFilteredNotifications(testAdminId, {
  status: 'all',
  type: 'all',
  limit: 50,
  skip: 0
});
console.log('Test 1 - All:', result1.notifications.length > 0 ? '✓ PASS' : '✗ FAIL');

// Test 2: Get unread only
const result2 = await NotificationService.getFilteredNotifications(testAdminId, {
  status: 'unread',
  type: 'all',
  limit: 50,
  skip: 0
});
console.log('Test 2 - Unread:', result2.notifications.every(n => !n.read) ? '✓ PASS' : '✗ FAIL');

// Test 3: Get orders only
const result3 = await NotificationService.getFilteredNotifications(testAdminId, {
  status: 'all',
  type: 'orders',
  limit: 50,
  skip: 0
});
const orderTypes = ['NEW_ORDER', 'ORDER_CANCELLED', 'SALE'];
console.log('Test 3 - Orders:', result3.notifications.every(n => orderTypes.includes(n.type)) ? '✓ PASS' : '✗ FAIL');

// Test 4: Combined filter
const result4 = await NotificationService.getFilteredNotifications(testAdminId, {
  status: 'unread',
  type: 'refunds',
  limit: 50,
  skip: 0
});
console.log('Test 4 - Unread Refunds:', 
  result4.notifications.every(n => !n.read && n.type === 'REFUND_REQUEST') ? '✓ PASS' : '✗ FAIL');
```

### 2. API Endpoint Tests

Using cURL or Postman:

```bash
# Test Endpoint 1: Get all notifications
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:5000/api/admin/notifications/filter?status=all&type=all"

# Response should be:
{
  "success": true,
  "notifications": [...],
  "total": X,
  "unreadCount": Y,
  "filters": { "status": "all", "type": "all" }
}

# Test Endpoint 2: Filter unread
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:5000/api/admin/notifications/filter?status=unread"

# Test Endpoint 3: Filter by type
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:5000/api/admin/notifications/filter?type=orders"

# Test Endpoint 4: Combined filters with pagination
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:5000/api/admin/notifications/filter?status=read&type=stock&limit=20&skip=0"
```

### 3. Frontend Context Tests

In browser console:

```javascript
// Get the NotificationContext from React DevTools or:
const { useNotifications } = await import(
  'http://localhost:5173/src/context/NotificationContext.jsx'
);

// Note: Direct testing is easier with React DevTools extension

// In a React component:
function TestComponent() {
  const { 
    filters, 
    setStatusFilter, 
    setTypeFilter, 
    resetFilters,
    notifications 
  } = useNotifications();

  return (
    <div>
      <p>Filters: {JSON.stringify(filters)}</p>
      <p>Notification Count: {notifications.length}</p>
      <button onClick={() => setStatusFilter('unread')}>Test Unread</button>
      <button onClick={() => setTypeFilter('orders')}>Test Orders</button>
      <button onClick={() => resetFilters()}>Test Reset</button>
    </div>
  );
}
```

## Integration Testing

### Test Scenario 1: Basic Filtering

1. **Setup**: Open notification panel
2. **Action**: Click "Unread" status filter
3. **Expected**: 
   - Unread button highlights blue
   - List shows only unread notifications
   - Other buttons remain inactive
4. **Verify**: Check browser Network tab
   - Request: `GET /api/admin/notifications/filter?status=unread&type=all`
   - Response: All notifications have `read: false`

### Test Scenario 2: Type Filtering

1. **Setup**: Start with filters reset (All)
2. **Action**: Click "Orders" type filter
3. **Expected**:
   - Orders button highlights green  
   - List shows NEW_ORDER, ORDER_CANCELLED, SALE types only
   - Status remains "All"
4. **Verify**: 
   - Request URL: includes `type=orders`
   - All returned notifications are order-related

### Test Scenario 3: Combined Filters

1. **Setup**: Notification panel open
2. **Action**: 
   - Click "Unread" status filter
   - Click "Orders" type filter
3. **Expected**:
   - Both buttons highlight (blue & green)
   - List shows unread order notifications only
   - Clear Filters button appears
4. **Verify**:
   - Request URL: `?status=unread&type=orders`
   - Every notification: `read === false` AND type in ['NEW_ORDER', 'ORDER_CANCELLED', 'SALE']

### Test Scenario 4: Clear Filters

1. **Setup**: Filters already applied
2. **Action**: Click "Clear Filters" button
3. **Expected**:
   - All filter buttons return to normal (not highlighted)
   - List resets to all notifications
   - Clear Filters button disappears
4. **Verify**:
   - Request URL: no status/type parameters
   - Notification count increases

### Test Scenario 5: Mark as Read

1. **Setup**: Unread filter active
2. **Action**: Click on unread notification
3. **Expected**:
   - Notification marked as read
   - Notification may disappear from list (if behavior requires)
   - OR notification appears in different state
4. **Verify**: Notification's `read` field is true

### Test Scenario 6: Multiple Type Filters (Sequential)

1. **Setup**: Start with all notifications
2. **Action**:
   - Click "Orders" (type filter)
   - While viewing orders, click "Refunds"
   - Then click "Stock Alerts"
3. **Expected**: List updates with each click to show selected type only
4. **Result**: Should test that type filter properly switches between values

## Edge Case Testing

### Edge Case 1: No Notifications Match Filter

1. **Setup**: Have mostly orders in system
2. **Action**: Apply "Customers" type filter
3. **Expected**:
   - Empty state message displays
   - Message: "No notifications" or "You're all caught up!"
   - No errors in console
4. **Verify**: Check Network response count is 0

### Edge Case 2: Mark All as Read with Filter

1. **Setup**: Unread filter active with 5+ notifications
2. **Action**: Click "Mark All Read" button
3. **Expected**:
   - Unread count drops to 0
   - List becomes empty (or shows empty state)
   - Unread button still highlighted but no notifications shown
4. **Verify**: Next time reset filters, no notifications appear as unread

### Edge Case 3: Rapid Filter Switching

1. **Setup**: Notification panel open
2. **Action**: Rapidly click between different filter buttons
3. **Expected**: 
   - UI remains responsive
   - No errors or flickering
   - Final state matches last filter clicked
4. **Verify**: Network tab shows requests are queued/handled correctly

### Edge Case 4: Filter + Pagination

1. **Setup**: Apply unread filter
2. **Action**: Scroll to bottom of notification list (trigger load more)
3. **Expected**: 
   - More unread notifications load
   - Filter still applied
   - No pagination conflicts
4. **Verify**: Request includes both filter params and pagination

### Edge Case 5: Login Session Expires

1. **Setup**: Filters active, then logout
2. **Action**: Login again, open notification panel
3. **Expected**:
   - Filters reset to defaults (All)
   - New notifications load correctly
   - No stale data from previous session
4. **Verify**: Context state properly reset

## Performance Testing

### Load Test 1: Large Dataset Filtering

1. **Prerequisites**: System has 1000+ notifications
2. **Test**: Apply multiple filters on large dataset
3. **Expected**:
   - Response time < 500ms
   - UI remains responsive
   - No freezing or lag
4. **Tools**: 
   - Chrome DevTools Network tab (Slow 3G simulation)
   - Measure API response time

### Load Test 2: Rapid Successive Filters

1. **Test**: Apply 10+ filter changes rapidly
2. **Expected**:
   - Requests properly cancelled/queued
   - Latest filter result displayed
   - No race conditions
3. **Verify**: Network tab shows well-ordered requests

### Load Test 3: Memory Leak Check

1. **Test**: 
   - Open/close notification panel 10+ times
   - Apply different filters each time
2. **Expected**: Memory usage stable (not constantly growing)
3. **Tools**: Chrome DevTools Memory tab, take heap snapshots

## Browser Compatibility Testing

Test in multiple browsers:

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | | Latest version |
| Firefox | | Latest version |
| Safari | | Latest version (if on Mac) |
| Edge | | Latest version |

For each browser:
- [ ] Filters render correctly
- [ ] Buttons are clickable
- [ ] Styling displays properly
- [ ] No console errors
- [ ] Responsive on mobile (use device emulation)

## Accessibility Testing

1. **Keyboard Navigation**:
   - [ ] Tab through filter buttons
   - [ ] Space/Enter to activate
   - [ ] Clear visual focus indicators

2. **Screen Reader**:
   - [ ] Button labels are announced correctly
   - [ ] Filter state is communicated
   - [ ] Active state is announced

3. **Color Contrast**:
   - [ ] Active button contrast meets WCAG AA
   - [ ] Hover states are distinguishable
   - [ ] Text is readable on all backgrounds

## Mobile Testing

Test on actual mobile devices or DevTools:

1. **iPhone 12**:
   - [ ] Filter buttons stack properly
   - [ ] Tap targets are >= 44x44px
   - [ ] Scrolling is smooth
   - [ ] Panel drawer works correctly

2. **Android**:
   - [ ] Same as iPhone + Android-specific behaviors

3. **Tablet (iPad)**:
   - [ ] Layout is optimized for larger screen
   - [ ] Buttons properly sized for touch

## Regression Testing Checklist

After each update, verify these still work:

- [ ] Basic notifications load
- [ ] Unread count is accurate
- [ ] Mark as read works
- [ ] Delete notification works
- [ ] Clear all notifications works
- [ ] Mark all as read works
- [ ] Real-time notifications still come through (Socket.IO)
- [ ] Refresh button works
- [ ] Panel opens/closes smoothly
- [ ] No JavaScript errors in console

## Test Data Setup

To create test notifications:

```javascript
// In backend, create test admin notifications
const NotificationService = require('./services/notificationService');

const adminId = 'YOUR_ADMIN_ID';

// Create test order notifications
await NotificationService.notifyNewOrder(adminId, {
  orderNumber: 'ORD001',
  amount: 5000,
  customerName: 'John Doe',
  orderId: 'OBJECTID'
});

// Create test stock alert
await NotificationService.notifyLowStock(adminId, {
  productName: 'Product X',
  stock: 5,
  productId: 'OBJECTID'
});

// Create test refund
await NotificationService.notifyRefundRequest(adminId, {
  customerName: 'Jane Doe',
  orderNumber: 'ORD001',
  amount: 2500,
  category: 'Defective'
});

// Create test customer
await NotificationService.notifyNewCustomer(adminId, {
  customerName: 'New Customer',
  email: 'test@example.com',
  customerId: 'OBJECTID'
});

// Create test message
await NotificationService.notifyContactMessage(adminId, {
  from: 'contact@example.com',
  subject: 'Support Request',
  contactId: 'OBJECTID'
});
```

## Test Results Documentation

Create a test report:

```markdown
# Test Report - Notification Filtering v1.0

Date: [DATE]
Tester: [NAME]
Browser: [CHROME 120]
OS: [WINDOWS 11]

## Test Summary
- Total Tests: 20
- Passed: 20 ✓
- Failed: 0
- Skipped: 0

## Detailed Results

### Functionality Tests
- [ ] ✓ Status filter works
- [ ] ✓ Type filter works
- [ ] ✓ Combined filters work
- [ ] ✓ Clear filters works
... (add all results)

## Known Issues
None

## Performance Results
- API Response Time: 150ms avg
- UI Render Time: 50ms avg
- Memory Usage: Stable

## Recommendations
- Ready for production
```

## Troubleshooting During Tests

| Issue | Solution |
|-------|----------|
| Filters not applying | Clear cache, reload, check console for errors |
| 404 errors | Verify route is registered in backend |
| Empty results | Check if test data exists and matches filter criteria |
| Styling broken | Verify CSS file is in correct location and imported |
| Slow performance | Check if MongoDB indexes are created |

## Post-Testing Signs of Success

✅ All filter buttons render and are clickable
✅ Filters update notification list instantly
✅ API calls are made with correct parameters
✅ Database queries return accurate results
✅ No JavaScript errors in console
✅ Styling displays correctly
✅ Mobile responsiveness works
✅ Performance is acceptable
✅ Clear filters button works reliably
