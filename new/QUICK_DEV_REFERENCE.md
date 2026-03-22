# 🚀 Quick Dev Reference Guide

A cheat sheet for common development tasks in the Electric Shop project.

---

## ⚡ Quick Start

### Start Development Environment
```powershell
# Windows PowerShell (Recommended - Automated)
.\full-startup.ps1

# OR Manual - Terminal 1
cd backend && npm run dev

# Manual - Terminal 2 (wait for backend first)
cd frontend && npm run dev

# Open browser
http://localhost:3003
```

### Stop Development Environment
```powershell
# Kill node process on port 50004
node backend/kill-port.js

# Or manually stop terminals
```

---

## 🔧 Common Backend Tasks

### Add New API Endpoint

**1. Create Controller Method** (`backend/controllers/yourController.js`)
```javascript
exports.getYourData = async (req, res) => {
  try {
    // Your logic here
    const data = await YourModel.find();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

**2. Create Route** (`backend/routes/yourRoutes.js`)
```javascript
const router = express.Router();
const { getYourData } = require('../controllers/yourController');
const { protect, adminProtect } = require('../middleware/auth');

router.get('/', protect, getYourData);  // Protected route
module.exports = router;
```

**3. Mount Route** (`backend/server.js`)
```javascript
const yourRoutes = require('./routes/yourRoutes');
app.use('/api/your-endpoint', yourRoutes);
```

### Add New Database Model

**File**: `backend/models/YourModel.js`
```javascript
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('YourModel', schema);
```

### Add Authentication to Endpoint

**Public**: No middleware needed
```javascript
router.get('/public', getPublicData);
```

**Customer Only** (Requires user login):
```javascript
router.get('/profile', protect, getProfile);
```

**Admin Only** (Requires admin login):
```javascript
router.get('/dashboard', adminProtect, getDashboard);
```

**Both Admin & Customer** (Either can access):
```javascript
router.get('/data', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) next();
  else res.status(401).json({ message: 'Unauthorized' });
});
```

### Seed Test Data

**Add data to database**:
```bash
cd backend
npm run seed               # Main seeder
npm run seed:catalog      # Product catalog
npm run seed:services     # Services data
npm run seed:pipes        # Pipe products
```

### Test API Endpoint

**Use curl or Postman**:
```bash
# Get request
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:50004/api/endpoint

# Post request
curl -X POST http://localhost:50004/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

---

## 🎨 Common Frontend Tasks

### Add New Customer Page

**1. Create Component** (`frontend/src/pages/customer/YourPage.jsx`)
```javascript
import { useState, useContext } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './YourPage.css';

const YourPage = () => {
  const [data, setData] = useState(null);
  
  return (
    <>
      <Navbar />
      <div className="page-container">
        {/* Your content */}
      </div>
      <Footer />
    </>
  );
};

export default YourPage;
```

**2. Create Styles** (`frontend/src/pages/customer/YourPage.css`)
```css
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
```

**3. Add Route** (`frontend/src/App.jsx`)
```javascript
import YourPage from './pages/customer/YourPage';

<Route path="/your-page" element={<YourPage />} />
```

### Add New Admin Page

**Same as above, but**:
- Create in `frontend/src/pages/admin/`
- Wrap route with `<AdminRoute>`:
```javascript
<Route path="/admin/your-page" element={<AdminRoute><YourPage /></AdminRoute>} />
```

### Use Authentication in Component

```javascript
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const MyComponent = () => {
  const { user, admin, login, logout, refreshUser } = useContext(AuthContext);
  
  // Check if logged in
  if (!user) return <div>Please login</div>;
  
  // User data
  console.log(user.name, user.email);
  
  return <div>Welcome, {user.name}</div>;
};
```

### Make API Call in Component

```javascript
import { useEffect } from 'react';
import API from '../../services/api';

const MyComponent = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await API.get('/api/endpoint');
        setData(response.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  return <div>{JSON.stringify(data)}</div>;
};
```

### Show Toast Notification

```javascript
import { useToast } from '../../hooks/useToast';

const MyComponent = () => {
  const { success, error, info, warning } = useToast();
  
  const handleClick = () => {
    success('Profile updated!');
    // or
    error('Something went wrong');
    // or
    info('Info message');
    // or
    warning('Warning message');
  };
  
  return <button onClick={handleClick}>Show Toast</button>;
};
```

### Fix Data Not Showing After Update (Pattern)

This is what we just fixed for the Profile page:

```javascript
// 1. Update on backend
await API.put('/api/endpoint', updateData);

// 2. Fetch fresh data
const result = await refreshUser();  // or your refresh method

// 3. Update context/state
if (result.success) {
  // Data is now updated in context
  // Components automatically re-render
}

// 4. Keep form in sync with context
useEffect(() => {
  if (contextData) {
    setFormData({...contextData});
  }
}, [contextData]);
```

---

## 🗄️ Database Tasks

### Fix MongoDB Connection

**Error**: "bad auth : authentication failed"

**Fix**:
1. Go to MongoDB Atlas: https://cloud.mongodb.com/
2. Click "Database Access" in left sidebar
3. Find your user and click "Edit"
4. Click "Edit Password" → "Autogenerate Secure Password"
5. Copy the new password
6. Update `backend/.env`:
   ```
   MONGO_URI=mongodb+srv://user:PASSWORD_HERE@cluster0...
   ```
7. Restart backend: `npm run dev`

### Connect to MongoDB Atlas Shell

```bash
# Get connection string from MongoDB Atlas
# Click "Connect" → "Connect with MongoDB Shell"
# Copy the connection string and run:

mongosh "mongodb+srv://cluster0.xxxxx.mongodb.net/database-name"
```

### Run MongoDB Diagnostics

```bash
cd backend
node check-mongodb.js      # Check connection
node check-all-orders.js   # Check orders data
node check-admins.js       # Check admin accounts
```

---

## 🔐 Authentication & Tokens

### Get User Token (For Testing)

1. Register/login customer at http://localhost:3003/login
2. Open DevTools (F12) → Application/Storage
3. Find `token` in localStorage
4. Copy and use in API requests

### Get Admin Token (For Testing)

1. Login to admin at http://localhost:3003/admin/login
2. Open DevTools (F12) → Application/Storage
3. Find `adminToken` in localStorage
4. Copy and use in admin API requests

### Test Authenticated Endpoint

```bash
# Get your token from localStorage first
set TOKEN=your_token_here

# Then use it:
curl -H "Authorization: Bearer %TOKEN%" \
  http://localhost:50004/api/users/profile
```

---

## 🐛 Debugging Tips

### Check What's in localStorage
```javascript
// In browser console
JSON.parse(localStorage.getItem('user'))
JSON.parse(localStorage.getItem('admin'))
localStorage.getItem('token')
localStorage.getItem('adminToken')
```

### See All API Calls
1. Open DevTools (F12)
2. Go to Network tab
3. Perform action
4. See all API requests/responses

### Debug API Interceptor Issues
Check `frontend/src/services/api.js` line 29-80 for:
- Which token is being sent
- Admin vs Customer routes
- Token selection logic

### Backend Request Logs
Backend logs every request:
```
[HH:MM:SS] 🔐 POST /api/products (with auth)
[HH:MM:SS] 🔓 GET /api/products (no auth)
```

### Database Query Debugging
Add console logs in MongoDB queries:
```javascript
console.log('Finding user with ID:', userId);
const user = await User.findById(userId);
console.log('Found user:', user);
```

---

## 📦 Install New Package

### Backend
```bash
cd backend
npm install package-name
```

### Frontend
```bash
cd frontend
npm install package-name
```

### DevDependency (Build tools, testing)
```bash
npm install --save-dev package-name
```

---

## 🚨 Common Errors & Fixes

### "Cannot GET /api/products" or "ECONNREFUSED"
**Backend not running**
```bash
cd backend
npm run dev
```

### "Module not found: api.js"
**Missing import path**
```javascript
// WRONG
import API from 'api';

// RIGHT
import API from '../../services/api';
```

### "Cannot read property 'map' of undefined"
**Forgot to check if data exists**
```javascript
// WRONG
{data.map(item => <div>{item}</div>)}

// RIGHT
{data && data.map(item => <div>{item}</div>)}
```

### "401 Unauthorized"
**Token missing or expired**
- Check localStorage for token
- Re-login
- Check token isn't corrupted

### "CORS error"
**Backend CORS config or port mismatch**
- Check `backend/server.js` CORS origins
- Verify proxy target in `frontend/vite.config.js`
- Both should use same backend port

### "Cannot access admin features"
**Not main admin account**
- Only `manielectricals@gmail.com` can access admin management
- Other admins get SUB_ADMIN role

---

## 📋 Environment Variables Checklist

### Backend (.env)
```
✅ MONGO_URI=mongodb+srv://...
✅ JWT_SECRET=your_secret_key
✅ PORT=50004
✅ GOOGLE_CLIENT_ID=...
✅ RAZORPAY_KEY_ID=...
✅ RAZORPAY_KEY_SECRET=...
✅ ADMIN_EMAIL=manielectricals@gmail.com
```

### Frontend (.env.local)
```
✅ VITE_API_URL=http://localhost:50004
✅ VITE_GOOGLE_CLIENT_ID=...
```

### Frontend (vite.config.js)
```javascript
✅ proxy target: 'http://localhost:50004'
✅ port: 3003
```

---

## 🔄 Git Workflow

### Check Current Status
```bash
git status
```

### See Recent Commits
```bash
git log --oneline -10
```

### Create New Branch
```bash
git checkout -b feature/my-feature
```

### Commit Changes
```bash
git add .
git commit -m "feat: Add new feature"
git push origin feature/my-feature
```

### View Changes Before Committing
```bash
git diff                   # All changes
git diff frontend/         # Only frontend changes
git diff backend/          # Only backend changes
```

---

## 📊 Key Directories Reference

| Path | Purpose | Common Tasks |
|------|---------|--------------|
| `backend/controllers/` | Business logic | Add endpoints |
| `backend/models/` | Database schemas | Add fields to documents |
| `backend/routes/` | API routes | Define new endpoints |
| `frontend/pages/customer/` | User pages | Add customer features |
| `frontend/pages/admin/` | Admin pages | Add admin features |
| `frontend/components/` | Reusable UI | Create components |
| `frontend/context/` | State management | Add global state |
| `frontend/services/` | API calls | API configuration |

---

## ⭐ Pro Tips

1. **Always start backend first** (port 50004), then frontend (port 3003)
2. **Check browser console** (F12) for JavaScript errors
3. **Check network tab** (F12) for API status codes
4. **Use `npm run dev`** not `npm start` for development
5. **Refresh browser** if changes don't appear
6. **Clear localStorage** if stuck: `localStorage.clear()` in console
7. **Check .env files** first for configuration issues
8. **Test API in Postman** before testing in frontend
9. **Use React DevTools** extension for component debugging
10. **Keep terminals running** - don't close them during development

---

## 🆘 Getting Help

1. **Check error message** - Read it completely
2. **Check logs** - Backend terminal and browser console
3. **Check configuration** - .env files and config.js files
4. **Search documentation** - PROFILE_UPDATE_FIX_GUIDE.md, etc.
5. **Check similar feature** - Look at working features for patterns
6. **Restart everything** - Kill all terminals and restart

---

**Last Updated**: March 6, 2026  
**Status**: Active Development  
**Questions?** Check PROJECT_OVERVIEW.md for full documentation
