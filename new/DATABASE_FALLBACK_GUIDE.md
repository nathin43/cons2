# Database Fallback Guide

## Overview
The application now supports running **without a database connection**. Products and cart functionality are visible and functional even if MongoDB is unavailable.

## What Changed

### 1. **Backend Server (server.js)**
- Removed mandatory database connection requirement
- Server starts successfully even if `MONGODB_URI` is not configured or connection fails
- Shows warning messages if database is unavailable
- Still requires `JWT_SECRET` for authentication features

### 2. **Product Controller (productController.js)**
- Added mock product data for fallback
- All product endpoints now support both database and mock data:
  - `GET /api/products` - Get all products with filtering/sorting
  - `GET /api/products/:id` - Get single product
  - `GET /api/products/featured` - Get featured products
  - `GET /api/products/categories` - Get product categories
- Automatically falls back to mock data if database query fails
- Returns `source: 'database'` or `source: 'mock-data'` in response

### 3. **Cart Controller (cartController.js)**
- Enhanced to support both authenticated (database) and guest (localStorage) carts
- All cart endpoints now support both modes:
  - `GET /api/cart` - Fetch cart
  - `POST /api/cart/add` - Add item to cart
  - `PUT /api/cart/update` - Update item quantity
  - `DELETE /api/cart/remove/:id` - Remove item
  - `DELETE /api/cart/clear` - Clear cart
- Gracefully falls back to localStorage validation if database fails

### 4. **Cart Routes (cartRoutes.js)**
- Removed mandatory authentication requirement
- Cart endpoints now work for both authenticated and guest users
- Authentication is optional - methods check if `req.user` exists

### 5. **Frontend CartContext (CartContext.jsx)**
- Added localStorage support for cart persistence
- Automatically uses localStorage when not authenticated
- Attempts database operations first if authenticated, falls back to localStorage
- Syncs cart data between sessions
- New methods:
  - `loadLocalCart()` - Load cart from localStorage
  - `saveToLocalStorage()` - Save cart to localStorage
  - `calculateTotal()` - Calculate cart total
- Added `useLocalStorage` state to track storage mode

## How It Works

### Product Browsing (No Auth Required)
```
User visits app
├─ Backend attempts to fetch products from MongoDB
├─ If database is available → Show real products
└─ If database fails → Show mock products
```

### Shopping Cart (Dual Mode)

**Authenticated User:**
```
User logs in
├─ Cart data stored in MongoDB database
└─ Synced across devices
```

**Guest User:**
```
User browses products
├─ Cart stored in browser localStorage
└─ Only available on current device
```

## Mock Data Included

The application includes 4 sample products for testing:
1. **Wireless Headphones** - $99.99
2. **USB-C Cable** - $12.99
3. **Screen Protector** - $9.99
4. **Phone Case** - $19.99

## Testing Without Database

### To test with database unavailable:
1. Don't set `MONGODB_URI` in `.env`
2. Or set it to invalid connection string
3. Start the server normally
4. Server will start with warning messages
5. Browse products - mock data will be displayed
6. Add items to cart - stored in localStorage

### To test with database:
1. Configure `MONGODB_URI` in `.env`
2. Start the server normally
3. Products and cart use database

## Environment Variables

```env
# Required
JWT_SECRET=your_jwt_secret_here

# Optional (server will run without it)
MONGODB_URI=mongodb+srv://...

# Other optional
NODE_ENV=development
PORT=5000
```

## Response Format

### Database Source
```json
{
  "success": true,
  "products": [...],
  "source": "database"
}
```

### Mock Data Source
```json
{
  "success": true,
  "products": [...],
  "source": "mock-data",
  "message": "Database unavailable - showing sample products"
}
```

## Browser Console Messages

**When database is available:**
```
✅ Database connected successfully
```

**When database is unavailable:**
```
⚠️  Database connection failed. Running in limited mode with mock data.
   Error: [error details]
```

## Frontend Status

The CartContext provides a `useLocalStorage` flag to check if using localStorage:
```jsx
const { useLocalStorage } = useContext(CartContext);

if (useLocalStorage) {
  // Show "Guest cart" indicator to user
}
```

## Limitations in Fallback Mode

| Feature | With Database | Mock Mode |
|---------|---------------|-----------|
| View Products | ✅ Real data | ✅ Sample data |
| Search/Filter | ✅ Full | ✅ Full |
| Add to Cart | ✅ Saved | ✅ localStorage |
| User Accounts | ✅ Yes | ❌ No |
| Order History | ✅ Yes | ❌ No |
| Admin Panel | ✅ Yes | ❌ No |
| Persistent Cart | ✅ Yes | ✅ Current device only |

## Switching Modes

The app intelligently switches between modes:
- **Authenticated + DB Available** → Database cart
- **Authenticated + DB Down** → Falls back to localStorage
- **Guest User** → localStorage cart

When the database comes back online and user is authenticated, cart data can be synced.

## Future Enhancements

- [ ] Implement cart sync when database reconnects
- [ ] Add more mock products
- [ ] Add localStorage to mock product cache
- [ ] Implement service worker for offline mode
- [ ] Add notification for database status changes

## Troubleshooting

**Cart not persisting after refresh?**
- Check if localStorage is enabled in browser
- Check browser console for errors
- Try incognito mode to rule out extensions

**Products showing old data?**
- Clear browser cache
- Check if MONGODB_URI is correctly configured
- Verify database is running and accessible

**Getting mixed data?**
- Refresh the page
- Check `source` field in API response
- Ensure consistent environment configuration
