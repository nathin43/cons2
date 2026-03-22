# Notification Filtering - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React/Vite)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  NotificationPanel.jsx                                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  [Header] Notifications                          [×]          │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │  NotificationFilterBar.jsx                                    │   │
│  │  ┌───────────────────────────────────────────────────────┐   │   │
│  │  │ Status Filter: [All] [Unread] [Read]                │   │   │
│  │  ├───────────────────────────────────────────────────────┤   │   │
│  │  │ Type Filter:                                          │   │   │
│  │  │ [All Types] [Orders] [Refunds] [Customers]           │   │   │
│  │  │ [Messages] [Stock Alerts]                             │   │   │
│  │  ├───────────────────────────────────────────────────────┤   │   │
│  │  │ [✕ Clear Filters]                                      │   │   │
│  │  └───────────────────────────────────────────────────────┘   │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │  Toolbar: [✓ Mark All Read] [🗑 Clear All]                   │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │  Content:                                                     │   │
│  │  - NotificationItem 1                                         │   │
│  │  - NotificationItem 2                                         │   │
│  │  - NotificationItem 3 (Filtered based on selections)          │   │
│  │  ...                                                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                            ↓                                         │
│                    Filter Actions                                    │
│                            ↓                                         │
│                 NotificationContext                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ State: { status, type, notifications, filters }              │   │
│  │                                                                │   │
│  │ Methods:                                                      │   │
│  │  • fetchFilteredNotifications(status, type, limit, skip)      │   │
│  │  • setStatusFilter(status)                                    │   │
│  │  • setTypeFilter(type)                                        │   │
│  │  • resetFilters()                                             │   │
│  │  • markAsRead(notificationId)                                 │   │
│  │  • deleteNotification(notificationId)                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                            ↓                                         │
│               API Service (axios)                                    │
│                            ↓                                         │
└─────────────────────────────────────────────────────────────────────┘
                             ↓
                    HTTP Requests
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Routes: notificationRoutes.js                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ GET /filter?status=X&type=Y&limit=50&skip=0                  │   │
│  │ GET / (all notifications)                                     │   │
│  │ GET /unread (unread only)                                     │   │
│  │ GET /count (unread count)                                     │   │
│  │ PUT /:id/read (mark as read)                                  │   │
│  │ DELETE / (clear all)                                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                            ↓                                         │
│  Controller: notificationController.js                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ getFilteredNotifications()                                    │   │
│  │  - Extract query params: status, type, limit, skip            │   │
│  │  - Call NotificationService.getFilteredNotifications()        │   │
│  │  - Return JSON response                                       │   │
│  │                                                                │   │
│  │ getUnreadNotifications()                                      │   │
│  │ getAllNotifications()                                         │   │
│  │ markAsRead()                                                  │   │
│  │ deleteNotification()                                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                            ↓                                         │
│  Service: notificationService.js                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ getFilteredNotifications(adminId, { status, type, ... })     │   │
│  │  - Build MongoDB query based on filters                       │   │
│  │  - Apply status filter: read/!read                            │   │
│  │  - Apply type filter: map 'orders' → [types]                 │   │
│  │  - Execute query with sort & pagination                       │   │
│  │  - Return { notifications, total }                            │   │
│  │                                                                │   │
│  │ getNotificationsByStatus()                                    │   │
│  │ getNotificationsByType()                                      │   │
│  │ getUnreadNotifications()                                      │   │
│  │ createNotification()                                          │   │
│  │ markAsRead()                                                  │   │
│  │ deleteNotification()                                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                            ↓                                         │
└─────────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   DATABASE (MongoDB Atlas)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Collection: notifications                                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Document:                                                     │   │
│  │ {                                                             │   │
│  │   _id: ObjectId(...),                                         │   │
│  │   admin: ObjectId(...),                                       │   │
│  │   type: "NEW_ORDER",              ← Filtered by type         │   │
│  │   title: "New Order Received",                                │   │
│  │   description: "....",                                        │   │
│  │   read: false,                    ← Filtered by status       │   │
│  │   color: "blue",                                              │   │
│  │   icon: "shopping-cart",                                      │   │
│  │   actionUrl: "/admin/orders/...",                             │   │
│  │   data: { ... },                                              │   │
│  │   createdAt: ISODate(...)                                     │   │
│  │ }                                                             │   │
│  │                                                                │   │
│  │ Indexes:                                                      │   │
│  │  • { admin: 1, read: 1, createdAt: -1 }     ← Fast filtering  │   │
│  │  • { admin: 1, createdAt: -1 }              ← Fast sorting    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow - Filter Applied

```
User clicks "Unread" button
       ↓
NotificationFilterBar calls setStatusFilter('unread')
       ↓
NotificationContext.setStatusFilter()
  - Updates filters state: { status: 'unread', type: 'all' }
  - Calls fetchFilteredNotifications('unread', 'all')
       ↓
API Request
  GET /api/admin/notifications/filter?status=unread&type=all
       ↓
Backend Controller
  - Receives status='unread', type='all'
  - Calls NotificationService.getFilteredNotifications()
       ↓
MongoDB Query
  db.notifications.find({
    admin: ObjectId(adminId),
    read: false,
    // type filter not applied since type='all'
  })
  .sort({ createdAt: -1 })
  .limit(50)
  .skip(0)
       ↓
Response Returns
  { notifications: [...], total: X, unreadCount: Y }
       ↓
Frontend updates
  - setNotifications(data.notifications)
  - FilterBar highlights "Unread" button
  - List re-renders with filtered items
```

## Type-to-Notification Mapping

```
User Selects: "Orders"
       ↓
Backend Query:
  type: { $in: ['NEW_ORDER', 'ORDER_CANCELLED', 'SALE'] }
       ↓
Results Include:
  ✓ NEW_ORDER           - Customer placed new order
  ✓ ORDER_CANCELLED     - Customer cancelled order
  ✓ SALE                - Sale completed
  ✗ LOW_STOCK           - Not an order type
  ✗ REFUND_REQUEST      - Separate type
  ✗ NEW_CUSTOMER        - Separate type

───────────────────────────────────────────────────────

User Selects: "Stock Alerts"
       ↓
Backend Query:
  type: { $in: ['LOW_STOCK', 'OUT_OF_STOCK'] }
       ↓
Results Include:
  ✓ LOW_STOCK           - Product stock running low
  ✓ OUT_OF_STOCK        - Product out of stock
  ✗ All other types

───────────────────────────────────────────────────────

User Selects: "Unread" + "Orders"
       ↓
Backend Query:
  {
    read: false,
    type: { $in: ['NEW_ORDER', 'ORDER_CANCELLED', 'SALE'] }
  }
       ↓
Results Include:
  ✓ Unread NEW_ORDER
  ✓ Unread ORDER_CANCELLED
  ✓ Unread SALE
  ✗ Read orders
  ✗ Other unread types
```

## Component Hierarchy

```
AdminLayout
└── AdminHeader
    └── NotificationBell
        └── NotificationPanel
            ├── NotificationFilterBar (NEW)
            │   ├── Status Filter Buttons
            │   ├── Type Filter Buttons
            │   └── Clear Filters Button
            ├── NotificationPanelToolbar
            ├── NotificationPanelContent
            │   └── NotificationList
            │       └── NotificationItem (x multiple)
            └── NotificationPanelFooter
```

## State Management Flow

```
Global State: NotificationContext
{
  notifications: [],        // Filtered notification list
  unreadCount: 0,          // Count of unread
  loading: false,          // Loading indicator
  filters: {               // Current active filters
    status: 'all',         // 'all', 'read', 'unread'
    type: 'all'            // 'all', 'orders', 'refunds', etc.
  }
}

Methods Provided:
  setStatusFilter(status)      → Updates status & fetches
  setTypeFilter(type)          → Updates type & fetches
  resetFilters()               → Resets to defaults & fetches
  fetchFilteredNotifications() → Directly fetch with params
  markAsRead(notificationId)   → Mark single notification read
  deleteNotification(notificationId) → Delete single
```

## Browser Network Timeline

```
1. Panel Opens
   → GET /api/admin/notifications?limit=50&skip=0
   ← { notifications: [...], unreadCount: X }
   → Render NotificationPanel with FilterBar

2. User Clicks "Unread"
   → GET /api/admin/notifications/filter?status=unread&type=all
   ← { notifications: [...], unreadCount: Z }
   → Re-render list with filtered items

3. User Clicks "Orders"
   → GET /api/admin/notifications/filter?status=unread&type=orders
   ← { notifications: [...], unreadCount: Y }
   → Re-render list with new filters

4. User Clicks "Clear Filters"
   → GET /api/admin/notifications?limit=50&skip=0
   ← { notifications: [...], unreadCount: X }
   → Reset to unfiltered list
```
