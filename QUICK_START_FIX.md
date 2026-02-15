# Quick Fix for "User not found" and Connection Errors

## Problem Solved
✅ **API Token Issue** - Fixed API interceptor to use correct token for customer support messages  
✅ **Error Handling** - Improved error messages to distinguish between connection and auth errors

## The Main Issue: Backend Not Running

The errors you're seeing:
```
ECONNREFUSED
User not found
```

These happen because **the backend server is not running**. 

## Solution: Start Both Servers

### Option 1: PowerShell Script (Recommended)
```powershell
cd d:\electrical1
.\startup.ps1
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```powershell
cd d:\electrical1\backend
npm start
```

**Terminal 2 - Frontend:**
```powershell
cd d:\electrical1\frontend
npm run dev
```

## What Was Fixed

### 1. API Token Logic (api.js)
**Before:**
```javascript
// ALL /contact routes used adminToken
else if (config.url.includes('/contact') && method !== 'post') {
  token = adminToken;
}
```

**After:**
```javascript
// /contact/my-messages uses userToken
else if (config.url.includes('/contact/my-messages')) {
  token = userToken;
}
// Other /contact routes use adminToken
else if (config.url.includes('/contact') && method !== 'post') {
  token = adminToken;
}
```

### 2. Better Error Messages (SupportMessages.jsx)
Now shows specific errors:
- "Cannot connect to server" - when backend is down
- "Session expired" - when token invalid (redirects to login)
- "Support messages endpoint not found" - for 404 errors

## Verification Steps

1. **Start Backend:**
   ```powershell
   cd backend
   npm start
   ```
   ✅ Should see: `Server running on port 5000` or `50004`

2. **Start Frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```
   ✅ Should see: `Local: http://localhost:3004/` (or similar)

3. **Test Support Messages:**
   - Login as customer
   - Go to profile dropdown → "Support Messages"
   - ✅ Should see messages (or empty state if no messages)
   - ❌ No more "User not found" errors

## If Still Having Issues

### Check MongoDB Connection
```powershell
cd backend
node test-connection.js
```

### Check Which Port Backend Uses
Look at `backend/.env`:
```env
PORT=50004  # or 5000
```

Make sure `frontend/vite.config.js` proxy points to same port:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:50004',  // Match backend port
    changeOrigin: true
  }
}
```

## Quick Test

After starting both servers:

1. Open browser: `http://localhost:3004`
2. Login with test user
3. Submit a contact form at `/contact`
4. Go to `/support-messages`
5. ✅ Should see your message

## Summary
- Fixed API token selection for `/contact/my-messages`
- Backend must be running on port 50004 (or 5000)
- Frontend connects via Vite proxy
- Better error messages guide users when server is down
