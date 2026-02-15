# Contact Messages System - Troubleshooting Guide

## ✅ System Fixed

The Contact Messages system has been fixed with the following changes:

### 🔧 Backend Changes

1. **Fixed Authentication Middleware** ([contactRoutes.js](backend/routes/contactRoutes.js))
   - Changed from `protect` to `adminProtect` for admin routes
   - `protect` = User authentication (for customers)
   - `adminProtect` = Admin authentication (for admin panel)
   
2. **Added Debug Logging** ([contactController.js](backend/controllers/contactController.js))
   - Console logs for message submission
   - Console logs for fetching messages
   - Better error tracking

3. **Updated CORS** ([server.js](backend/server.js))
   - Added Vite dev server port (5173) to allowed origins
   - Ensures frontend can communicate with backend

### 🎨 Frontend Changes

1. **Enhanced Error Handling** ([AdminContactMessages.jsx](frontend/src/pages/admin/AdminContactMessages.jsx))
   - Better error messages for different scenarios
   - 401: Not authorized
   - 404: API endpoint not found
   - Console logging for debugging

## 🔍 How to Verify It's Working

### Step 1: Start Backend
```bash
cd backend
node server.js
```

Expected output:
```
✅ MongoDB Connected: cluster0...
🚀 Server running on port 50004
```

### Step 2: Test Database Connection (Optional)
```bash
cd backend
node test-contact.js
```

This will:
- Create a test contact message
- Fetch all messages
- Show statistics
- Clean up test data

### Step 3: Start Frontend
```bash
cd frontend
npm run dev
```

### Step 4: Submit Test Message
1. Go to `http://localhost:3003/contact`
2. Fill out the contact form
3. Submit
4. Check browser console for:
   ```
   📝 New contact form submission: {...}
   ✅ Contact message saved to MongoDB: 507f...
   ```

### Step 5: View in Admin Panel
1. Login as admin: `http://localhost:3003/admin/login`
2. Go to "Contact Messages" in sidebar
3. Should see all submitted messages

## 🐛 Troubleshooting

### Issue: "Failed to load contact messages"

**Check 1: Admin is logged in**
```javascript
// Open browser console
localStorage.getItem('adminToken') // Should return a token
```

**Check 2: Backend is running**
```bash
# Visit: http://localhost:50004/
# Should show: {"message":"🔌 Electric Shop API","version":"1.0.0","status":"Running"}
```

**Check 3: MongoDB is connected**
```bash
# Check backend terminal for:
✅ MongoDB Connected: cluster0...
```

**Check 4: API call succeeds**
```javascript
// Open browser console on admin page
await API.get('/contact')
// Should return: {success: true, count: X, data: [...]}
```

### Issue: "Not authorized" error

**Problem**: Admin token is missing or invalid

**Solution**:
1. Logout and login again
2. Check localStorage has `adminToken`
3. Verify token hasn't expired

### Issue: Messages not appearing after submission

**Check 1: Form submission**
```javascript
// Browser console after form submit:
API Request: POST /contact (no auth)
✅ Message sent successfully!
```

**Check 2: Database save**
```javascript
// Backend terminal:
📝 New contact form submission: {...}
✅ Contact message saved to MongoDB: 507f...
```

**Check 3: Admin fetch**
```javascript
// Browser console on admin page:
API Request: GET /contact (with auth)
📥 API Response: {success: true, count: 1, data: [...]}
```

## 📊 API Endpoints

### Public Routes
- `POST /api/contact` - Submit contact form (no auth required)

### Admin Routes (require admin authentication)
- `GET /api/contact` - Get all messages
- `GET /api/contact/unread-count` - Get count of new messages
- `GET /api/contact/:id` - Get single message
- `PUT /api/contact/:id/mark-read` - Mark as read
- `PUT /api/contact/:id/reply` - Send reply
- `DELETE /api/contact/:id` - Delete message

## 🔐 Authentication Flow

1. **Customer submits form** → No authentication needed
2. **Admin views messages** → Requires admin JWT token
3. **Token location**: `localStorage.getItem('adminToken')`
4. **Token format**: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## ✨ Database Schema

```javascript
{
  _id: "507f191e810c19729de860ea",
  contactId: "507f191e810c19729de860ea",
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  inquiryType: "general-question",
  message: "I have a question...",
  status: "new", // "new" | "read" | "replied" | "resolved"
  createdAt: "2026-02-10T12:00:00.000Z",
  updatedAt: "2026-02-10T12:00:00.000Z"
}
```

## 🎯 Expected Flow

```
Customer Form → POST /api/contact → MongoDB
                          ↓
                MongoDB stores message
                          ↓
         Admin Dashboard → GET /api/contact → Display messages
```

## ✅ Verification Checklist

- [ ] Backend server running on port 50004
- [ ] MongoDB connected successfully
- [ ] Frontend running on port 3003
- [ ] Admin logged in (adminToken in localStorage)
- [ ] Contact form submits successfully
- [ ] Messages appear in admin panel
- [ ] Can mark messages as read
- [ ] Can delete messages
- [ ] Badge shows correct count of new messages

---

**Last Updated:** February 10, 2026
**Status:** ✅ System fully operational
