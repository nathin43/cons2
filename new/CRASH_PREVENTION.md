# 🛡️ Crash Prevention Guide

## Common Crash Causes & Solutions

### 1. **Backend Crashes**

#### Missing Environment Variables
- ❌ **Problem**: `MONGODB_URI` not set in `.env`
- ✅ **Solution**: 
  ```bash
  # In backend/.env
  MONGODB_URI=your-mongodb-connection-string
  JWT_SECRET=your-secret-key
  PORT=5000
  NODE_ENV=development
  ```

#### Database Connection Fails
- ❌ **Problem**: MongoDB is offline or unreachable
- ✅ **Solution**:
  ```bash
  # Test MongoDB connection
  node check-mongodb.js
  
  # Verify connection string format
  # Should be: mongodb+srv://username:password@cluster.mongodb.net/dbname
  ```

#### Port Already in Use
- ❌ **Problem**: Port 5000 is already running
- ✅ **Solution**:
  ```bash
  # Change PORT in .env or kill the process
  netstat -ano | findstr :5000    # Find process
  taskkill /PID <PID> /F           # Kill process
  ```

---

### 2. **Frontend Crashes**

#### Missing Environment Variables
- ❌ **Problem**: `VITE_API_URL` not set
- ✅ **Solution**:
  ```bash
  # In frontend/.env.local
  VITE_API_URL=http://localhost:5000
  VITE_GOOGLE_CLIENT_ID=your-google-id
  ```

#### API Connection Fails
- ❌ **Problem**: Frontend can't reach backend
- ✅ **Solution**:
  - Make sure backend is running on port 5000
  - Check CORS is enabled in backend
  - Verify `VITE_API_URL` points to correct backend URL

#### Missing npm Dependencies
- ❌ **Problem**: Module not found errors
- ✅ **Solution**:
  ```bash
  cd frontend
  npm install
  ```

---

### 3. **Startup Checklist**

Before running the project:

- [ ] Backend `.env` has `MONGODB_URI`
- [ ] Backend `.env` has `JWT_SECRET`
- [ ] Frontend `.env.local` has `VITE_API_URL`
- [ ] MongoDB is running/accessible
- [ ] Port 5000 and 3000-3001 are available
- [ ] Both backend and frontend dependencies installed (`npm install`)

---

### 4. **Safe Startup Process**

#### Backend:
```bash
cd backend
npm install           # Install dependencies
node check-mongodb.js # Verify DB connection
npm run dev          # Start server
```

#### Frontend:
```bash
cd frontend
npm install              # Install dependencies
npm run dev            # Start dev server
# Visit http://localhost:3000 or 3001
```

---

### 5. **Debugging Tips**

**Check Logs:**
- Backend: Look at console output for error messages
- Frontend: Open browser DevTools (F12) → Console tab

**Test Connectivity:**
```bash
# Test backend health
curl http://localhost:5000

# Test API endpoint
curl http://localhost:5000/api/auth
```

**Clear Cache:**
```bash
# Frontend
cd frontend
rm -r node_modules/.vite
npm run dev

# Or restart dev server with Ctrl+C then `npm run dev`
```

---

### 6. **Environment Variables Reference**

**Backend (.env)**
```
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
NODE_ENV=development
ADMIN_EMAIL=admin@electricshop.com
ADMIN_PASSWORD=admin123
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
GOOGLE_CLIENT_ID=your-google-client-id
```

**Frontend (.env.local)**
```
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

### 7. **Emergency Recovery**

If everything crashes:

```bash
# 1. Hard reset dependencies
cd backend && rm -rf node_modules package-lock.json && npm install
cd ../frontend && rm -rf node_modules package-lock.json && npm install

# 2. Clear caches
cd frontend && rm -rf node_modules/.vite

# 3. Verify environment
node backend/check-mongodb.js

# 4. Start fresh
cd backend && npm run dev
# In new terminal:
cd frontend && npm run dev
```

---

## Still Having Issues?

1. **Check error message carefully** - It usually tells you what's wrong
2. **Verify environment variables** - Most crashes are due to missing env vars
3. **Restart the dev server** - Simple but effective
4. **Clear node_modules** - Dependency conflicts are common
5. **Check port availability** - Use `netstat` to verify ports are free

