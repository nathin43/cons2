# 🛡️ Crash Prevention & Stability Guide

This guide will help you **prevent crashes** and keep your Electric Shop e-commerce project running smoothly.

---

## 🚀 Quick Start (Safest Way)

### Windows - Using Startup Script

```bash
# In project root directory
.\startup.ps1
```

This script will:
- ✅ Create missing `.env` files
- ✅ Install all dependencies
- ✅ Validate environment setup
- ✅ Test database connection
- ✅ Tell you exactly what to do next

### Manual Setup

#### Terminal 1: Start Backend
```bash
cd backend
npm run validate    # Check environment first
npm run test-db    # Test database connection
npm run dev        # Start backend
```

#### Terminal 2: Start Frontend
```bash
cd frontend
npm run dev
```

#### Open Browser
```
http://localhost:3000  (or 3001 if 3000 is busy)
```

---

## ⚠️ Most Common Crash Causes

### 1. **Missing `.env` Files**
```
❌ ERROR: ENOENT: no such file or directory, open '.env'
```

**Fix:**
```bash
# Create backend/.env with required variables:
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/database
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### 2. **Missing Environment Variables**
```
❌ ERROR: MONGODB_URI is not defined
```

**Fix:**
```bash
# In backend/.env, add:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/electric-shop?retryWrites=true&w=majority
JWT_SECRET=electric_shop_jwt_secret_key_2024
```

### 3. **Missing Dependencies**
```
❌ Cannot find module 'express'
```

**Fix:**
```bash
cd backend
npm install

cd ../frontend
npm install
```

### 4. **Database Connection Failed**
```
❌ MongooseError: connect ECONNREFUSED
```

**Causes:**
- MongoDB is offline
- IP not whitelisted in MongoDB Atlas
- Wrong connection string
- No internet connection

**Fix:**
```bash
# Test your database connection:
cd backend
npm run test-db

# If that fails:
# 1. Go to MongoDB Atlas: https://www.mongodb.com/cloud/atlas
# 2. Check Network Access - whitelist your IP
# 3. Verify connection string format
```

### 5. **Port Already in Use**
```
❌ EADDRINUSE: address already in use :::5000
```

**Fix:**
```bash
# Option 1: Change port in backend/.env
PORT=5001

# Option 2: Kill the process using port 5000
netstat -ano | findstr :5000        # Find the PID
taskkill /PID <PID> /F             # Kill the process
```

### 6. **Frontend Blank Page / API Errors**
```
❌ GET http://localhost:5000/api/... net::ERR_CONNECTION_REFUSED
```

**Fix:**
```bash
# In frontend/.env.local, verify:
VITE_API_URL=http://localhost:5000

# Make sure backend is running:
# Terminal 1 should show:
# 🚀 Server running on port 5000
```

---

## 📋 Pre-Startup Checklist

Before running `npm run dev`, verify:

- [ ] **Backend Setup**
  - [ ] `backend/.env` file exists
  - [ ] `MONGODB_URI` is set in `.env`
  - [ ] `JWT_SECRET` is set in `.env`
  - [ ] `npm install` completed
  - [ ] Database connection works: `npm run test-db`

- [ ] **Frontend Setup**
  - [ ] `frontend/.env.local` file exists
  - [ ] `VITE_API_URL=http://localhost:5000` is set
  - [ ] `npm install` completed

- [ ] **System Requirements**
  - [ ] Port 5000 is available
  - [ ] Ports 3000-3001 are available
  - [ ] MongoDB is accessible
  - [ ] Internet connection is working

---

## 🔧 Validation Commands

Run these commands to verify your setup is correct:

```bash
# Check backend environment
cd backend
npm run validate

# Test database connection
npm run test-db

# List installed packages
npm list --depth=0

# Check backend health
curl http://localhost:5000
```

---

## 📊 Environment Variables Reference

### Backend (`backend/.env`)

**Required:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/electric-shop?retryWrites=true&w=majority
JWT_SECRET=electric_shop_jwt_secret_key_2024_change_in_production
PORT=5000
```

**Recommended:**
```env
NODE_ENV=development
ADMIN_EMAIL=admin@electricshop.com
ADMIN_PASSWORD=admin123
```

**Optional (for email/OAuth):**
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
GOOGLE_CLIENT_ID=your-google-client-id
```

### Frontend (`frontend/.env.local`)

**Required:**
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-client-id-from-google-cloud
```

---

## 🆘 Emergency Fixes

If everything crashes, try these in order:

### Fix 1: Clear Cache and Reinstall
```bash
# Backend
cd backend
rm -r node_modules package-lock.json
npm install
npm run validate

# Frontend
cd frontend
rm -r node_modules package-lock.json
npm install
```

### Fix 2: Clear Vite Cache
```bash
cd frontend
rm -r node_modules/.vite
npm run dev
```

### Fix 3: Hard Reset
```bash
# Kill all node processes
taskkill /F /IM node.exe

# Wait a few seconds, then:

# Backend
cd backend
npm run dev

# Frontend (in new terminal)
cd frontend
npm run dev
```

### Fix 4: Check Logs
```bash
# Backend logs show detailed errors
# Look at console output for error messages

# Frontend logs (Press F12 in browser)
# Open DevTools → Console tab
# Look for error messages
```

---

## 🧪 Testing Your Setup

Once both servers are running:

### Test 1: Backend Health
```bash
curl http://localhost:5000
```

Expected response:
```json
{
  "message": "🔌 Electric Shop API",
  "version": "1.0.0",
  "status": "Running"
}
```

### Test 2: Database Connection
```bash
curl http://localhost:5000/api/products
```

Should return products list (or empty array if no products)

### Test 3: Frontend
Open browser: `http://localhost:3000`

Check DevTools console (F12) - should be no errors

---

## 📁 Project Structure Check

Verify your project has this structure:

```
electric-shop-ecommerce/
├── backend/
│   ├── .env                          (Required!)
│   ├── package.json
│   ├── server.js
│   ├── validate-startup.js
│   ├── check-mongodb.js
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── node_modules/
├── frontend/
│   ├── .env.local                    (Required!)
│   ├── package.json
│   ├── vite.config.js
│   └── node_modules/
├── startup.ps1
├── startup.bat
└── SAFE_STARTUP.md
```

---

## 🎯 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Blank frontend page | Backend not running | Start backend with `npm run dev` |
| Cannot connect to DB | Invalid MongoDB URI | Check connection string in `.env` |
| Cannot connect to DB | IP not whitelisted | Add your IP to MongoDB Atlas |
| Port 5000 in use | Another process using it | Change `PORT` in `.env` or kill process |
| npm install fails | Node/npm issue | Reinstall Node.js or clear npm cache |
| Module not found | Missing dependency | Run `npm install` |
| API 404 errors | Wrong backend URL | Check `VITE_API_URL` in frontend `.env.local` |
| CORS errors | Frontend/backend mismatch | Verify backend CORS is enabled |

---

## 🚨 When All Else Fails

1. **Read the error message carefully** - it usually tells you exactly what's wrong
2. **Run validation script** - `npm run validate` catches most issues
3. **Check .env files** - 80% of crashes are due to missing env vars
4. **Clear cache** - Delete `node_modules` and reinstall
5. **Restart servers** - Sometimes a fresh start fixes everything
6. **Check ports** - Ensure ports 5000, 3000, 3001 are available
7. **Check internet** - Some features need internet (GitHub OAuth, email)

---

## 📚 More Resources

- [SAFE_STARTUP.md](SAFE_STARTUP.md) - Step-by-step startup guide
- [CRASH_PREVENTION.md](CRASH_PREVENTION.md) - Detailed crash prevention tips
- [README.md](README.md) - Full project documentation
- [START_SERVER.md](START_SERVER.md) - Server startup guide

---

## ✅ Success Indicators

When everything is working correctly, you should see:

**Backend Terminal:**
```
✨ Database connection established successfully

==================================================
🚀 Server running on port 5000
🌐 API URL: http://localhost:5000
📝 Environment: development
==================================================
```

**Frontend Terminal:**
```
  VITE v5.4.21  ready in 283 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**Browser:**
- No errors in DevTools Console (F12)
- Electric Shop UI loads properly
- Can navigate between pages
- Products load from database

**Database:**
- Can read/write data
- Queries execute without errors

---

## 🎓 Pro Tips

1. **Always run validation first** - `npm run validate` catches issues before they crash
2. **Use separate terminals** - One for backend, one for frontend
3. **Check logs early** - Error messages appear at startup
4. **Keep .env files safe** - Don't commit them to Git
5. **Test database connection** - `npm run test-db` ensures DB is accessible
6. **Enable debug logs** - Set `NODE_ENV=development` for detailed logs

---

**Remember:** Most crashes are preventable! Follow this guide and your project will run smoothly. 🚀

