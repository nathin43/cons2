# ✅ Safe Startup Guide

Follow these steps to start your project **without crashes**.

## Step 1: Verify Environment Setup

### Backend
```bash
cd backend
node validate-startup.js
```

Expected output:
```
✅ MONGODB_URI is set
✅ JWT_SECRET is set
✅ PORT is set
✅ express is installed
✅ mongoose is installed
... (more checks)
✨ All validations passed! Ready to start server.
```

If you see ❌ errors, fix them before continuing.

### Frontend
Verify `.env.local` exists:
```bash
cd frontend
cat .env.local
```

Should show:
```
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-id
```

---

## Step 2: Install Dependencies (if needed)

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

---

## Step 3: Test Database Connection

```bash
cd backend
node check-mongodb.js
```

Expected output:
```
🔄 Attempting to connect to MongoDB...
✅ MongoDB Connected: cluster0.tycseyy.mongodb.net
📊 Database Name: electric-shop
✨ Database connection established successfully
```

If this fails:
- Verify `MONGODB_URI` in `.env`
- Check MongoDB Atlas is accessible
- Verify your IP is whitelisted in MongoDB

---

## Step 4: Start Backend

```bash
cd backend
npm run dev
```

Expected output:
```
🔄 Attempting to connect to MongoDB...
✅ MongoDB Connected: cluster0.tycseyy.mongodb.net
✨ Database connection established successfully

🚀 Server running on port 5000
🌐 API URL: http://localhost:5000
```

✅ Leave this terminal running!

---

## Step 5: Start Frontend (in new terminal)

```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v5.4.21  ready in 283 ms

  ➜  Local:   http://localhost:3000/
```

Open browser: **http://localhost:3000** (or 3001 if 3000 is busy)

---

## Troubleshooting Quick Fixes

| Error | Solution |
|-------|----------|
| `ENOENT: no such file or directory, open '.env'` | Create `.env` file in backend folder |
| `MONGODB_URI` not found | Add `MONGODB_URI` to `.env` |
| `Cannot find module 'express'` | Run `npm install` in backend/frontend |
| `Port 5000 already in use` | Change `PORT=5001` in `.env` or kill existing process |
| `TypeError: Cannot read properties of undefined` | Check all required env vars are set |
| Frontend shows blank page | Check console (F12) for errors, verify `VITE_API_URL` |

---

## Health Check

Once both are running:

### Test Backend
```bash
curl http://localhost:5000
```

Should return:
```json
{
  "message": "🔌 Electric Shop API",
  "version": "1.0.0",
  "status": "Running"
}
```

### Test Frontend
Open browser: http://localhost:3000

Should show Electric Shop UI without errors in DevTools console (F12).

---

## Pre-Startup Checklist

- [ ] `.env` file exists in `backend` folder
- [ ] `.env.local` file exists in `frontend` folder
- [ ] `MONGODB_URI` is set in backend `.env`
- [ ] `JWT_SECRET` is set in backend `.env`
- [ ] `VITE_API_URL` is set in frontend `.env.local`
- [ ] `npm install` completed in both folders
- [ ] MongoDB connection test passed (`node check-mongodb.js`)
- [ ] Port 5000 is available
- [ ] Ports 3000-3001 are available

---

## Running Validation Check

Always run this before starting to catch issues early:

```bash
cd backend
node validate-startup.js
```

This script checks:
- ✅ All required environment variables
- ✅ MongoDB URI format
- ✅ Required npm packages
- ✅ Directory structure
- ✅ File permissions

If all checks pass, it's safe to start!

