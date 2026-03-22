# 🚀 Electric Shop - Startup Guide

## Quick Start (Recommended)

### Windows PowerShell
```powershell
.\full-startup.ps1
```

This automated script will:
- ✅ Check all configuration files
- ✅ Install dependencies (if needed)
- ✅ Start the backend server on port 50004
- ✅ Wait for backend to be ready
- ✅ Start the frontend server on port 3003
- ✅ Open your browser automatically

---

## Manual Startup (If needed)

### Terminal 1: Start Backend
```powershell
cd backend
npm run dev
```

You should see:
```
🚀 Server running on port 50004
✅ Database: Connected
```

### Terminal 2: Start Frontend (Wait for backend to show above message first!)
```powershell
cd frontend
npm run dev
```

You should see:
```
Local: http://localhost:3003/
```

Then open your browser to: **http://localhost:3003**

---

## Configuration Files

### Backend Configuration
**File:** `backend/.env`
- **PORT=50004** - Must match `frontend/vite.config.js` proxy target
- **MONGODB_URI** - Database connection string
- **JWT_SECRET** - Authentication secret

### Frontend Configuration
**File:** `frontend/.env.local`
- **VITE_API_URL** - Should be `http://localhost:50004` (or wherever backend runs)
- **VITE_GOOGLE_CLIENT_ID** - Google OAuth client ID

**File:** `frontend/vite.config.js`
- Proxy target must match backend PORT (currently 50004)
- If you change backend port, update proxy target here!

---

## Troubleshooting

### ❌ Error: ECONNREFUSED on /api/products

**Cause:** Backend server is not running or port mismatch

**Fix:**
1. Make sure backend is running:
   ```powershell
   cd backend
   npm run dev
   ```

2. Check that port 50004 is in use:
   ```powershell
   netstat -ano | findstr :50004
   ```

3. Verify backend/.env has correct PORT:
   ```
   PORT=50004
   ```

4. Verify frontend/vite.config.js has matching target:
   ```javascript
   target: 'http://localhost:50004'
   ```

### ❌ Backend fails to start

**Check:**
1. Is backend/.env missing?
   ```powershell
   Test-Path backend\.env
   ```

2. Is MongoDB URI valid? Test connection:
   ```powershell
   cd backend
   npm run test-db
   ```

3. Run validation:
   ```powershell
   cd backend
   npm run validate
   ```

### ❌ Port 50004 already in use

**Solution:**
1. Kill the process using port 50004:
   ```powershell
   netstat -ano | findstr :50004
   taskkill /PID <PID> /F
   ```

2. Or change port in backend/.env to a different port (e.g., 5000) and update frontend/vite.config.js accordingly

### ❌ Frontend still can't connect after backend starts

**Clear browser cache:**
1. Press F12 to open DevTools
2. Right-click refresh button → Empty cache and hard refresh
3. Or use Ctrl+Shift+Delete to clear browser cache

---

## Port Reference

| Service | Port | Configuration |
|---------|------|---------------|
| **Frontend (Vite)** | 3003 | `frontend/.env.local` & `frontend/vite.config.js` |
| **Backend API** | 50004 | `backend/.env` & proxied in `frontend/vite.config.js` |
| **MongoDB** | N/A (Cloud) | `backend/.env` MONGODB_URI |

---

## Important: Backend MUST Start First! ⚠️

The frontend cannot function without the backend.

**Correct Order:**
1. ✅ Start backend → Wait for "Database: Connected" message
2. ✅ Start frontend → Refresh browser if needed

**Wrong Order:**
1. ❌ Start frontend → You'll see ECONNREFUSED errors
2. ❌ Start backend → Errors persist until frontend refreshes

---

## Environment Variables

### Backend (backend/.env)
```env
PORT=50004                    # Backend server port (MUST match vite proxy target!)
MONGODB_URI=...              # Your MongoDB Atlas connection string
JWT_SECRET=...               # Secret key for JWT tokens
JWT_EXPIRE=7d                # Token expiry
NODE_ENV=development         # Environment mode
ADMIN_EMAIL=...              # Admin account email
ADMIN_PASSWORD=...           # Admin account password
GOOGLE_CLIENT_ID=...         # Google OAuth client ID
EMAIL_SERVICE=gmail          # Email service provider
EMAIL_USER=...               # Email address for OTP
EMAIL_PASS=...               # Email app password (not regular password)
```

### Frontend (frontend/.env.local)
```env
VITE_API_URL=http://localhost:50004    # Backend API URL
VITE_GOOGLE_CLIENT_ID=...              # Google OAuth client ID
```

---

## Common Commands

```powershell
# Start everything automatically (Recommended)
.\full-startup.ps1

# Start backend in development mode
cd backend && npm run dev

# Start frontend in development mode
cd frontend && npm run dev

# Build frontend for production
cd frontend && npm run build

# Validate backend setup
cd backend && npm run validate

# Test MongoDB connection
cd backend && npm run test-db

# Seed database
cd backend && npm run seed

# Check if port is in use
netstat -ano | findstr :50004
```

---

## What to Look For: Success Indicators ✅

### Backend Ready
```
==================================================
🚀 Server running on port 50004
🌐 API URL: http://localhost:50004
📝 Environment: development
📊 Database: ✅ Connected
🏥 Health check: http://localhost:50004/api/health
==================================================
```

### Frontend Ready
```
➜  Local:   http://localhost:3003/
➜  Network: use --host to expose
```

### API Connected
- No red errors in browser console
- Products load on the page
- API requests show 200 status in Network tab (DevTools)

---

## Need Help?

1. **Check Logs:** Look at backend and frontend terminal output
2. **Use DevTools:** Press F12 in browser, check Console and Network tabs
3. **Test Health:** Visit `http://localhost:50004/api/health`
4. **Validate Setup:** Run `cd backend && npm run validate`
5. **Test DB:** Run `cd backend && npm run test-db`

---

**Last Updated:** February 9, 2026
