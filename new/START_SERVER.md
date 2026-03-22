# 🚀 Electric Shop - Start Server Guide

## ⚠️ IMPORTANT: MongoDB Atlas Setup

Your project uses **MongoDB Atlas** cloud database. To fix the connection error, follow these steps:

### Step 1: Whitelist Your IP Address

1. Go to [MongoDB Atlas Console](https://cloud.mongodb.com/v2/)
2. Sign in with your account
3. Click on **Cluster0** (your cluster)
4. Go to **Security** → **Network Access** (left sidebar)
5. Click **"+ Add IP Address"** button
6. Choose one option:
   - **Option A (Recommended for Development):** Enter `0.0.0.0/0` (allows all IPs)
   - **Option B (More Secure):** Enter your current IP address (find it via https://whatismyipaddress.com/)
7. Click **"Confirm"**
8. ⏳ Wait **2-3 minutes** for MongoDB to update the whitelist

### Step 2: Verify Connection String

Your `.env` file already has the correct connection string:
```
MONGODB_URI=mongodb+srv://nathinb23bsr_db_user:A5DbCsVnQoIxu3xc@cluster0.tycseyy.mongodb.net/electric-shop?retryWrites=true&w=majority
```

### Step 3: Start the Backend Server

```powershell
# Navigate to backend folder
cd D:\consultancy\electric-shop-ecommerce\backend

# Run the development server
npm run dev
```

✅ Expected output:
```
✅ MongoDB Connected: cluster0.tycseyy.mongodb.net
📊 Database Name: electric-shop
✨ Database connection established successfully
🚀 Server running on port 5000
🌐 API URL: http://localhost:5000
```

### Step 4: Start the Frontend Server (in a NEW terminal)

```powershell
# Navigate to frontend folder
cd D:\consultancy\electric-shop-ecommerce\frontend

# Run the development server
npm run dev
```

✅ Expected output:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Step 5: Seed Sample Data (Optional - in a NEW terminal)

Once MongoDB is connected, populate demo data:

```powershell
cd D:\consultancy\electric-shop-ecommerce\backend
npm run seed
```

---

## 🔧 Troubleshooting

### Still getting "Could not connect to any servers" error?

1. **Check your IP is whitelisted:**
   - Go to MongoDB Atlas → Security → Network Access
   - Verify your IP is in the whitelist list

2. **Check your connection string:**
   - Verify `.env` file has correct `MONGODB_URI`
   - Make sure it includes the database name: `?retryWrites=true&w=majority`

3. **Check internet connection:**
   - Make sure your internet is working
   - Try accessing https://cloud.mongodb.com to verify connectivity

4. **Wait longer:**
   - MongoDB whitelist changes can take 5+ minutes sometimes
   - Wait 5 minutes and try again

---

## 📋 Project Configuration

- **Backend:** Node.js + Express + MongoDB
- **Frontend:** React + Vite
- **Database:** MongoDB Atlas (Cloud)
- **Port:** Backend 5000, Frontend 3000 (dev) or 5173 (Vite)

---

## 📚 API Endpoints

- **Auth:** `/api/auth/` (login, register, logout)
- **Products:** `/api/products/` (CRUD operations)
- **Admin:** `/api/admin/` (dashboard, management)
- **Cart:** `/api/cart/` (add, remove, update)
- **Orders:** `/api/orders/` (create, list, track)
- **Users:** `/api/users/` (profile, preferences)

---

## ✨ Next Steps

1. ✅ Whitelist IP in MongoDB Atlas
2. ✅ Start backend server (`npm run dev`)
3. ✅ Start frontend server (`npm run dev`)
4. ✅ Visit http://localhost:5173 in your browser
5. ✅ Register/Login and test the application

Good luck! 🎉
