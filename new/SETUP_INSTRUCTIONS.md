# Setup Instructions - Fix All Errors

## ✅ Fixed Issues

1. ✅ **Duplicate Index Warnings** - Removed from GeneratedReport model
2. ✅ **Port Occupation** - Killed stuck node process on port 50004
3. ✅ **Environment Variable Validation** - Updated to check MONGO_URI
4. ✅ **Vercel SPA Routing** - Added vercel.json for admin routes
5. ✅ **Production Image URLs** - Added BASE_URL support

---

## ⚠️ ONE ISSUE REMAINING: MongoDB Authentication

**Error**: `❌ MongoDB Connection Error: bad auth : authentication failed`

**Cause**: Your MongoDB Atlas password is incorrect or expired.

### Quick Fix (2 minutes):

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com/

2. **Login** with your account

3. **Click "Database Access"** (left sidebar)

4. **Find your user**: `nathinb23bsr_db_user`

5. **Click "Edit"** button next to the user

6. **Click "Edit Password"**

7. **Click "Autogenerate Secure Password"** button

8. **IMPORTANT: Copy the password** that appears (you'll need it in the next step)

9. **Click "Update User"** to save

10. **Open your `.env` file**: `backend/.env`

11. **Replace `YOUR_NEW_PASSWORD`** with the password you copied in step 8:
    ```dotenv
    MONGO_URI=mongodb+srv://nathinb23bsr_db_user:PASTE_PASSWORD_HERE@cluster0.tycseyy.mongodb.net/electric-shop?retryWrites=true&w=majority
    MONGODB_URI=mongodb+srv://nathinb23bsr_db_user:PASTE_PASSWORD_HERE@cluster0.tycseyy.mongodb.net/electric-shop?retryWrites=true&w=majority
    ```

12. **Save the file**

13. **Restart your server**:
    ```bash
    cd backend
    npm run dev
    ```

---

## Expected Output After Fix:

```
🔍 Running Startup Validation...
✅ MONGO_URI is set
✅ JWT_SECRET is set
✅ PORT is set
✅ MONGO_URI format looks valid

[nodemon] starting `node --openssl-legacy-provider server.js`
🚀 Server running on port 50004
📊 Environment: development
✅ MongoDB Connected: cluster0.tycseyy.mongodb.net
📊 Database Name: electric-shop
✨ Database connection established successfully
```

---

## Production Deployment Checklist

Once your local server is running, deploy to production:

### Render (Backend)
1. Add environment variable: `BASE_URL=https://manielectrical-backend.onrender.com`
2. Add environment variable: `MONGO_URI=your_atlas_connection_string`
3. Render will auto-deploy from GitHub

### Vercel (Frontend)
- Already configured with `vercel.json` ✅
- Will auto-deploy from GitHub ✅

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Add authorized origin: `https://manielectrical.vercel.app`

---

## All Changes Pushed to GitHub ✅

Commit: `1517ce7` - "fix: Remove duplicate index declarations"

Render will auto-deploy these fixes when you push.

---

## Need Help?

If MongoDB Atlas doesn't work, you can also:

**Option B: Create New Free Cluster**
1. Go to https://cloud.mongodb.com/
2. Click "Create" → "Build a Database"
3. Choose "M0 Free" tier
4. Click "Create Cluster"
5. Create new database user with password
6. Get connection string and update your `.env`

MongoDB Atlas is free for development (512MB storage).
