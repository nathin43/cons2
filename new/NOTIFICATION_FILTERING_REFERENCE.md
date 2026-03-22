# 🎯 Notification Filtering - Quick Reference Card

## FILTER TYPES

```
┌─────────────────────────────────────────────────────────┐
│ STATUS FILTERS (Read/Unread)                            │
├─────────────────────────────────────────────────────────┤
│ All      → Shows all notifications                      │
│ Unread   → Shows notifications where read = false       │
│ Read     → Shows notifications where read = true        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ TYPE FILTERS (By Category)                              │
├─────────────────────────────────────────────────────────┤
│ Orders        → NEW_ORDER, ORDER_CANCELLED, SALE        │
│ Refunds       → REFUND_REQUEST                          │
│ Customers     → NEW_CUSTOMER                            │
│ Messages      → CONTACT_MESSAGE                         │
│ Stock Alerts  → LOW_STOCK, OUT_OF_STOCK                 │
└─────────────────────────────────────────────────────────┘
```

## API QUICK CALLS

```bash
# Get all notifications
GET /api/admin/notifications/filter?status=all&type=all

# Get only unread
GET /api/admin/notifications/filter?status=unread

# Get only orders
GET /api/admin/notifications/filter?type=orders

# Get unread orders
GET /api/admin/notifications/filter?status=unread&type=orders

# Get unread refunds
GET /api/admin/notifications/filter?status=unread&type=refunds

# Get with pagination
GET /api/admin/notifications/filter?limit=10&skip=20
```

## CONTEXT HOOKS

```javascript
import { useNotifications } from './context/NotificationContext';

const {
  notifications,           // Filtered notification list
  filters,                 // { status, type }
  unreadCount,            // Number of unread
  loading,                // API loading state
  setStatusFilter,        // Update status filter
  setTypeFilter,          // Update type filter
  resetFilters,           // Clear all filters
  fetchFilteredNotifications,  // Manual fetch
  markAsRead,             // Mark one as read
  deleteNotification,     // Delete one
} = useNotifications();
```

## UI BUTTON COLORS

```
STATUS FILTERS:
  Active:    Blue (#3b82f6)     → [Unread]
  Inactive:  Gray               → [All] [Read]

TYPE FILTERS:
  Active:    Green (#10b981)    → [Orders]
  Inactive:  Gray               → [All Types] [Refunds]...

CLEAR BUTTON:
  Color:     Red (#ef4444)
  Shows:     Only when filters applied
```

## FILE LOCATIONS

```
BACKEND:
  services/notificationService.js     Search: getFilteredNotifications()
  controllers/notificationController.js  Search: getFilteredNotifications()
  routes/notificationRoutes.js        Search: GET /filter

FRONTEND:
  context/NotificationContext.jsx     Search: setStatusFilter()
  components/admin/NotificationFilterBar.jsx      (NEW)
  components/admin/NotificationFilterBar.css      (NEW)
  components/admin/NotificationPanel.jsx          (UPDATED)

DOCS:
  NOTIFICATION_FILTERING_IMPLEMENTATION.md
  NOTIFICATION_FILTERING_QUICKSTART.md
  NOTIFICATION_FILTERING_ARCHITECTURE.md
  NOTIFICATION_FILTERING_TESTS.md
```

## USAGE PATTERNS

```javascript
// Pattern 1: Show unread only
const { setStatusFilter } = useNotifications();
useEffect(() => {
  setStatusFilter('unread');
}, []);

// Pattern 2: Show orders only
const { setTypeFilter } = useNotifications();
useEffect(() => {
  setTypeFilter('orders');
}, []);

// Pattern 3: Unread orders
const { setStatusFilter, setTypeFilter } = useNotifications();
useEffect(() => {
  setStatusFilter('unread');
  setTypeFilter('orders');
}, []);

// Pattern 4: Custom filter
const { fetchFilteredNotifications } = useNotifications();
await fetchFilteredNotifications('read', 'refunds', 50, 0);

// Pattern 5: Reset filters
const { resetFilters } = useNotifications();
await resetFilters();
```

## COMPONENT STRUCTURE

```
AdminHeader
  └─ NotificationBell
       └─ NotificationPanel
            ├─ NotificationFilterBar ✨ NEW
            │   ├─ Status Filter Buttons
            │   ├─ Type Filter Buttons
            │   └─ Clear Filters Button
            ├─ Toolbar
            ├─ Content
            │   └─ NotificationList
            │       └─ NotificationItem
            └─ Footer
```

## QUERY PARAMETERS

| Parameter | Values | Default | Example |
|-----------|--------|---------|---------|
| status | all, read, unread | all | ?status=unread |
| type | all, orders, refunds, customers, messages, stock | all | ?type=orders |
| limit | 1-100 | 50 | ?limit=20 |
| skip | 0+ | 0 | ?skip=40 |

## DEBUGGING TIPS

```javascript
// Check current filters
console.log(filters);  // { status: 'unread', type: 'orders' }

// Check notifications loaded
console.log(notifications.length);  // Should match expected count

// Verify API call
// Open DevTools → Network → Filter requests for "notifications"

// Check if button active
// Inspect element → Look for class: "active"

// Test context directly (in React DevTools)
// Go to Components tab → find NotificationContext → check props
```

## COMMON COMBINATIONS

| Use Case | Status | Type | Trigger |
|----------|--------|------|---------|
| Urgent unread items | Unread | - | Morning review |
| Pending orders | All | Orders | After storefront launch |
| Refund processing | Unread | Refunds | Daily check |
| New customers | All | Customers | Growth tracking |
| Stock management | All | Stock | Inventory review |
| Support tickets | Unread | Messages | Customer support |

## ERROR HANDLING

```javascript
try {
  await setStatusFilter('unread');
} catch (error) {
  console.error('Filter failed:', error);
  // Fallback to showing all
  await resetFilters();
}

// Check Network tab for:
✓ Request URL correct
✓ Status code 200
✓ Response has success: true
✗ Any 401 (auth needed)
✗ Any 404 (route missing)
✗ Any 500 (server error)
```

## PERFORMANCE TARGETS

| Metric | Target | Expected |
|--------|--------|----------|
| API Response | < 500ms | ~150ms |
| UI Update | < 100ms | ~50ms |
| Filter Click → List Update | < 1s | ~250ms |
| No. Notifications | 1000+ | Scalable |
| Mobile Performance | Smooth | Optimized |

## MOBILE LAYOUT

```
Smaller screens (<480px):
- Filter buttons stack narrower
- Padding reduced
- Font slightly smaller
- Touch target remains >= 44x44px
- Scrolling vertical only
```

## STATE FLOW SUMMARY

```
User Action       | Context Updates  | API Call             | List Updates
─────────────────────────────────────────────────────────────────────────
Click "Unread"    | status='unread'  | GET ?status=unread   | Shows unread only
Click "Orders"    | type='orders'    | GET ?type=orders     | Shows orders
Click both        | Both updated     | GET ?status=X&type=Y | Shows filtered
Click Clear       | Resets to 'all'  | GET (no params)      | Shows all
```

## TROUBLESHOOTING FLOWCHART

```
Filters not working?
├─ Check browser console for errors
├─ Verify API endpoint registered
├─ Check Network tab for requests
├─ Confirm DB has test notifications
└─ Test with fresh page load

Styling issues?
├─ Verify CSS file exists
├─ Check it's imported in component
├─ Hard refresh (Ctrl+Shift+R)
└─ Check if CSS file in src/components/admin/

Performance slow?
├─ Check Network response time
├─ Verify DB indexes exist
├─ Check notification count
└─ Monitor memory usage in DevTools
```

## DEPLOYMENT CHECKLIST

- [ ] Backend file syntax verified
- [ ] Frontend files created
- [ ] CSS file present and imported
- [ ] Context updated with new methods
- [ ] NotificationPanel imports FilterBar
- [ ] Database indexes exist
- [ ] Test with sample notifications
- [ ] Mobile responsive verified
- [ ] All documentation files in place

---

**Reference Created**: March 6, 2026
**Version**: 1.0
**Status**: Complete ✅
