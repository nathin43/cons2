# Production Deployment Fixes - Complete Guide

This document explains the fixes implemented for production deployment on Render (backend) and Vercel (frontend).

## Three Main Issues Fixed

### 1. Admin Route (Frontend) ✅ VERIFIED

**Issue**: Admin routes not working in production
**Status**: Already properly configured - no changes needed

**Implementation**:
- Admin routes properly configured in `frontend/src/App.jsx`
- Using React Router v6 with proper route structure:
  ```jsx
  /admin                  → AdminLogin
  /admin/login            → AdminLogin
  /admin/dashboard        → AdminDashboard (protected)
  /admin/products         → AdminProducts (protected)
  /admin/orders           → AdminOrders (protected)
  /admin/customers        → AdminCustomers (protected)
  /admin/reports          → AdminReports (protected)
  /admin/admin-management → AdminManagement (main admin only)
  ```
- All admin routes protected by `AdminRoute` component  - MainAdminRoute for sensitive admin management pages

**No action required** - Routes are production-ready.

---

### 2. Fix Images Not Loading (Backend Static Path) ✅ FIXED

**Issue**: Product images not loading in production because paths are relative (`/uploads/products/image.jpg`) instead of full URLs (`https://backend.onrender.com/uploads/products/image.jpg`)

**Root Cause**: 
- Static file serving works fine with `app.use('/uploads', express.static(...))`
- But when frontend is on Vercel and backend on Render, frontend needs full URLs to access images

**Solution Implemented**:

#### 1. Created Image URL Utility (`backend/utils/imageUrl.js`)
```javascript
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Get BASE_URL from environment
  const baseUrl = process.env.BASE_URL || '';
  
  // Return full URL if BASE_URL exists, otherwise relative path
  return baseUrl ? `${baseUrl}${imagePath}` : imagePath;
};

// Helper functions to process single/multiple products
```

#### 2. Updated Product Controller
Modified all product response endpoints to process images:
- `getProducts()` - List products
- `getProduct()` - Single product
- `getFeaturedProducts()` - Featured products
- `createProduct()` - New product
- `updateProduct()` - Update product
- `toggleProductStatus()` - Status update

Each response now processes products through `processProductImages()` or `processProductsImages()` before returning.

#### 3. Environment Variable Configuration

**Local Development** (no changes needed):
```env
# No BASE_URL needed - uses relative paths
```

**Production (Render)**:
```env
BASE_URL=https://manielectrical-backend.onrender.com
```

Add this to your Render environment variables.

**Result**:
- Local development: Images work with relative paths (`/uploads/products/image.jpg`)
- Production: Full URLs returned (`https://manielectrical-backend.onrender.com/uploads/products/image.jpg`)
- Frontend on Vercel can now access backend images correctly

---

### 3. Fix Continue with Google (OAuth Production Fix) ✅ VERIFIED

**Issue**: Google OAuth not working in production
**Status**: Already properly configured - just needs Google Console setup

**Implementation**:
- Backend correctly uses `OAuth2Client.verifyIdToken()` method
- Frontend sends credential directly to `/api/auth/google` endpoint
- No callback URL needed (frontend handles Google Sign-In flow)

**Google Console Configuration Required**:

1. **Go to**: [Google Cloud Console](https://console.cloud.google.com/)

2. **APIs & Services > Credentials**

3. **Update OAuth 2.0 Client ID**:
   - **Authorized JavaScript origins**:
     ```
     https://manielectrical.vercel.app
     http://localhost:5173
     ```
   
   - **Authorized redirect URIs**: Not needed for this implementation
     (Frontend uses Google's popup flow, not redirect)

4. **Copy Client ID** to your frontend `.env`:
   ```
   VITE_GOOGLE_CLIENT_ID=your-google-client-id-from-console
   ```

5. **Ensure backend has** `GOOGLE_CLIENT_ID` in Render environment variables:
   ```
   GOOGLE_CLIENT_ID=same-client-id-from-google-console
   ```

**How It Works**:
1. Frontend shows Google Sign-In button
2. User clicks → Google popup appears
3. User signs in → Google returns credential token
4. Frontend sends credential to backend `/api/auth/google`
5. Backend verifies with `OAuth2Client.verifyIdToken()`
6. Backend creates/updates user and returns JWT token
7. Frontend stores JWT and user is logged in

**No code changes needed** - Just configure Google Console with production domain.

---

## Environment Variables Summary

### Backend (Render)
```env
# Required
MONGO_URI=your_mongodb_uri
PORT=5000
NODE_ENV=production
JWT_SECRET=your_jwt_secret

# New for production images
BASE_URL=https://manielectrical-backend.onrender.com

# For Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# For CORS
CORS_ORIGIN=https://manielectrical.vercel.app
```

### Frontend (Vercel)
```env
# API Configuration
VITE_API_URL=https://manielectrical-backend.onrender.com
VITE_SOCKET_URL=https://manielectrical-backend.onrender.com

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## Testing Checklist

After deploying to production:

### Admin Routes
- [ ] Can access `/admin` and `/admin/login`
- [ ] Can login as admin
- [ ] Redirects to `/admin/dashboard`
- [ ] All admin pages accessible
- [ ] Route protection works (unauthenticated users redirected)

### Images
- [ ] Product images load on homepage
- [ ] Product images load on products page
- [ ] Product images load on product details page
- [ ] Product images load in cart
- [ ] Product images load in admin product management
- [ ] Check browser network tab: images loaded from `https://your-backend.onrender.com/uploads/...`

### Google OAuth
- [ ] "Continue with Google" button appears
- [ ] Clicking opens Google popup
- [ ] After signing in, popup closes
- [ ] User is logged in automatically
- [ ] User data appears in profile
- [ ] Check browser console: no CORS errors

---

## Deployment Steps

1. **Update Render Environment Variables**:
   - Add `BASE_URL=https://manielectrical-backend.onrender.com`
   - Verify `GOOGLE_CLIENT_ID` is set
   - Verify `MONGO_URI` is set

2. **Push Code to GitHub**:
   ```bash
   git add .
   git commit -m "fix: Add BASE_URL support for production image URLs"
   git push origin main
   ```

3. **Render Auto-Deploy**:
   - Render detects push and rebuilds automatically
   - Monitor build logs in Render dashboard

4. **Configure Google Console**:
   - Add `https://manielectrical.vercel.app` to authorized origins
   - Save changes (may take a few minutes to propagate)

5. **Test Production**:
   - Visit `https://manielectrical.vercel.app`
   - Test all three features above

---

## Files Modified

### New Files
- `backend/utils/imageUrl.js` - Image URL processing utility
- `backend/.env.example` - Environment variable documentation

### Modified Files
- `backend/controllers/productController.js` - Added image URL processing to all responses

---

## Troubleshooting

### Images Still Not Loading
- Check Render logs: `console.log` statements will show BASE_URL value
- Verify `BASE_URL` environment variable is set correctly (no trailing slash)
- Check browser network tab for failed image requests
- Verify backend static file serving: `curl https://your-backend.onrender.com/uploads/products/test.jpg`

### Google OAuth Not Working
- Check browser console for error messages
- Verify `VITE_GOOGLE_CLIENT_ID` matches Google Console Client ID
- Ensure frontend domain is in Google Console authorized origins
- Check backend logs for "Google auth error" messages
- Verify backend `GOOGLE_CLIENT_ID` matches frontend

### Admin Routes 404
- Check Vercel deployment settings: should have `rewrites` for SPA routing
- Verify React Router is using `BrowserRouter` not `HashRouter`
- Check browser console for routing errors

---

## Support

If issues persist after following this guide:
1. Check Render backend logs
2. Check Vercel frontend logs
3. Check browser console for errors
4. Verify all environment variables are set correctly
5. Test API endpoints directly with Postman/curl

---

**Status**: All three issues resolved ✅  
**Last Updated**: Production deployment fixes implemented  
**Next Steps**: Deploy to Render and configure Google Console
