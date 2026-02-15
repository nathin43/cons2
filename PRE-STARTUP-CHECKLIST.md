# ✅ Pre-Startup Checklist

## Before You Start - Verify Everything!

Use this checklist to ensure the application will start without connection errors.

---

## 1. Configuration Files Exist

- [ ] `backend/.env` exists
- [ ] `frontend/.env.local` exists (or will be auto-created)
- [ ] `frontend/vite.config.js` exists
- [ ] `backend/server.js` exists

**Check in PowerShell:**
```powershell
Test-Path backend\.env
Test-Path frontend\.env.local
Test-Path frontend\vite.config.js
```

---

## 2. Backend Port Configuration

**In `backend/.env`:**
- [ ] Contains: `PORT=50004`

**In `frontend/vite.config.js`:**
- [ ] Proxy target contains: `target: 'http://localhost:50004'`
- [ ] Both `/api` and `/uploads` proxy to port 50004

**Verify they match:**
```powershell
# Check backend port
Select-String "PORT=" backend\.env

# Check frontend proxy
Select-String "localhost:" frontend\vite.config.js
```

**Expected output:**
```
PORT=50004
target: 'http://localhost:50004'
```

❌ **If they don't match:** Update them to use the same port!

---

## 3. Database Configuration

**In `backend/.env`:**
- [ ] `MONGODB_URI` is present and valid
- [ ] MongoDB Atlas whitelist includes your IP
- [ ] Database connection string is complete

**Test connection:**
```powershell
cd backend
npm run test-db
```

**Expected:** Database connection successful ✅

---

## 4. Required Environment Variables

**Backend (`backend/.env`):**
- [ ] `PORT=50004`
- [ ] `MONGODB_URI=mongodb+srv://...`
- [ ] `JWT_SECRET=...` (not empty)
- [ ] `NODE_ENV=development`

**Frontend (`frontend/.env.local`):**
- [ ] `VITE_API_URL=http://localhost:50004` (should match backend port!)
- [ ] `VITE_GOOGLE_CLIENT_ID=...`

---

## 5. Port Availability

**Check if required ports are free:**
```powershell
# Check port 50004 (Backend)
netstat -ano | findstr :50004

# Check port 3003 (Frontend)
netstat -ano | findstr :3003
```

**Expected:** No output (ports are free)

**If ports are in use:**
1. [ ] Close the applications using those ports
2. [ ] Or change PORT in backend/.env and update frontend/vite.config.js

---

## 6. Dependencies Installed

**Check if node_modules exist:**
```powershell
# Check backend
Test-Path backend\node_modules

# Check frontend
Test-Path frontend\node_modules
```

**If missing:**
```powershell
cd backend
npm install

cd ..\frontend
npm install
```

---

## 7. Start Order Verification

- [ ] I will start BACKEND first
- [ ] I will wait for "Database: Connected" message
- [ ] I will THEN start FRONTEND
- [ ] I will NOT start frontend before backend finishes loading

---

## Quick Start Once Checklist is Complete

```powershell
# Option 1: Automated (Recommended)
.\full-startup.ps1

# Option 2: Manual - Terminal 1
cd backend
npm run dev

# Option 2: Manual - Terminal 2 (after backend shows "Database: Connected")
cd frontend
npm run dev

# Option 2: Manual - Browser
http://localhost:3003
```

---

## What NOT to Do ❌

❌ Don't start frontend before backend is ready
❌ Don't have mismatched ports between backend/.env and vite.config.js
❌ Don't forget to wait for "Database: Connected" message
❌ Don't run both commands in the same terminal (use separate terminals)
❌ Don't ignore "ECONNREFUSED" errors - they mean backend isn't running
❌ Don't change PORT in backend/.env without updating frontend/vite.config.js

---

## If You See Errors

### ECONNREFUSED Error
⚠️ **Means:** Backend server is not running or port doesn't match

**Fix:**
1. Make sure backend started successfully
2. Check backend/.env PORT matches frontend/vite.config.js target
3. Wait longer for backend to fully start (20-30 seconds possible)
4. Check backend terminal for errors

### Can't connect to MongoDB
⚠️ **Means:** Database connection failed

**Fix:**
1. Verify MONGODB_URI in backend/.env is correct
2. Check MongoDB Atlas connection string format
3. Verify your IP is whitelisted in MongoDB Atlas
4. Test with: `cd backend && npm run test-db`

### Port Already in Use
⚠️ **Means:** Another process is using that port

**Fix:**
1. Find and close the process using the port
2. Or change the port and update both files

---

## Success Indicators ✅

### Backend Should Show:
```
🚀 Server running on port 50004
✅ Database: Connected
```

### Frontend Should Show:
```
Local: http://localhost:3003/
```

### Browser Should Show:
- No red errors in Console (F12)
- Products displaying from API
- No ECONNREFUSED errors

---

## Final Check Before Starting

```powershell
# Run this simple check
Write-Host "Backend port in .env:" (Select-String "PORT=" backend\.env).Line
Write-Host "Frontend proxy target:" (Select-String "localhost" frontend\vite.config.js | Select-Object -First 1).Line
```

**Both should show port 50004**

If they don't match → **UPDATE THEM NOW** before starting!

---

**Ready to start?** Run:
```powershell
.\full-startup.ps1
```

Good luck! 🚀

---

**Last Updated:** February 9, 2026
**Version:** 1.0
