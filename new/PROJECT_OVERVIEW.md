# 🏢 Project Overview - Electric Shop E-Commerce Platform

**Project Name**: Electric Shop E-Commerce | **Status**: 🔄 Active Development  
**Last Updated**: March 6, 2026 | **Stack**: MERN (MongoDB, Express, React, Node.js)

---

## 📊 Project Summary

A full-stack e-commerce platform specializing in electrical products with a comprehensive admin management system. The platform supports dual authentication (customer & admin), real-time messaging via WebSocket, advanced reporting, and a complete order management lifecycle.

### 🎯 Business Model
- **B2C E-Commerce**: Direct sales to retail customers
- **Product Categories**: TV, AC, Fan, Fridge, Heater, Switches, Tank, Wire & Cable, Water Heater, Plus Motors, Lights, Pipes, Services
- **Revenue Streams**: Product sales, service offerings, order fulfillment
- **Key Feature**: Real-time admin-to-customer report messaging

---

## 🏗️ Technology Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | LTS | Runtime |
| Express.js | 4.18.2 | Web Framework |
| MongoDB | Atlas | Database |
| Mongoose | 8.0.0 | ODM |
| JWT | 9.0.2 | Authentication |
| Bcryptjs | 2.4.3 | Password Hashing |
| Socket.IO | 4.8.3 | Real-time Messaging |
| Multer | 1.4.5 | File Upload |
| Razorpay | 2.9.6 | Payment Gateway |
| Nodemailer | 7.0.11 | Email Service |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.2.0 | UI Framework |
| React Router | 6.20.0 | Routing |
| Vite | 5.0.7 | Build Tool |
| Axios | 1.6.2 | HTTP Client |
| Socket.IO Client | 4.8.3 | Real-time Messaging |
| CSS3 | - | Styling (Custom) |

### Infrastructure
- **Backend Host**: Render (Deployment-ready)
- **Frontend Host**: Vercel (Deployment-ready)
- **Database**: MongoDB Atlas (Cloud)
- **Email**: Nodemailer (Configured)
- **Payments**: Razorpay (Production-ready)

---

## 📁 Project Root Structure

```
electrical1/
├── backend/                          # Node.js Express API Server
│   ├── config/                       # Configuration files
│   │   ├── db.js                     # MongoDB connection
│   │   └── specificationSchemas.js   # Product spec definitions
│   ├── controllers/                  # Business logic (18 files)
│   │   ├── authController.js         # Auth logic
│   │   ├── productController.js      # Product CRUD
│   │   ├── orderController.js        # Order management
│   │   ├── adminController.js        # Admin dashboard
│   │   ├── reportController.js       # Report generation
│   │   ├── razorpayController.js     # Payment processing
│   │   └── [13 more]                # Other features
│   ├── middleware/                   # Express middleware
│   │   ├── auth.js                   # JWT verification
│   │   ├── upload.js                 # File upload config
│   │   └── checkUserStatus.js        # User status checks
│   ├── models/                       # Mongoose schemas (12 files)
│   │   ├── User.js                   # Customer model
│   │   ├── Admin.js                  # Admin model
│   │   ├── Product.js                # Product model
│   │   ├── Order.js                  # Order model
│   │   ├── Report.js                 # Report model
│   │   ├── GeneratedReport.js        # Report snapshots
│   │   └── [6 more]                 # Other models
│   ├── routes/                       # API routes (15 files)
│   │   ├── authRoutes.js             # Auth endpoints
│   │   ├── productRoutes.js          # Product endpoints
│   │   ├── orderRoutes.js            # Order endpoints
│   │   ├── adminRoutes.js            # Admin endpoints
│   │   └── [11 more]                # Other route groups
│   ├── services/                     # Business logic services
│   ├── utils/                        # Utility functions
│   ├── uploads/                      # Product images storage
│   ├── server.js                     # Main entry point
│   ├── package.json                  # Dependencies
│   └── .env                          # Environment variables
│
├── frontend/                         # React Vite App
│   ├── src/
│   │   ├── components/               # Reusable UI components (35+ files)
│   │   │   ├── Navbar.jsx            # Top navigation
│   │   │   ├── AdminLayout.jsx       # Admin sidebar layout
│   │   │   ├── ProductCard.jsx       # Product listing card
│   │   │   ├── Toast/                # Notification system
│   │   │   ├── SupportWidget.jsx     # Help widget
│   │   │   └── [30+ more]           # Other components
│   │   ├── context/                  # React Context
│   │   │   ├── AuthContext.jsx       # Auth state management
│   │   │   └── CartContext.jsx       # Cart state
│   │   ├── hooks/                    # Custom React hooks (2 files)
│   │   │   ├── useToast.js           # Toast notifications
│   │   │   └── useAdminLoader.js     # Admin data loading
│   │   ├── pages/                    # Route pages (50+ files)
│   │   │   ├── customer/             # Customer routes (16 pages)
│   │   │   │   ├── Home.jsx          # Landing page
│   │   │   │   ├── Products.jsx      # Product listing
│   │   │   │   ├── Cart.jsx          # Shopping cart
│   │   │   │   ├── Checkout.jsx      # Payment checkout
│   │   │   │   ├── Orders.jsx        # Order history
│   │   │   │   ├── Profile.jsx       # User profile (Just Fixed!)
│   │   │   │   └── [10 more]        # Other customer pages
│   │   │   └── admin/                # Admin routes (34 pages)
│   │   │       ├── AdminDashboard.jsx # Admin overview
│   │   │       ├── AdminProducts.jsx  # Product management
│   │   │       ├── AdminOrders.jsx    # Order management
│   │   │       ├── AdminReports.jsx   # Report dashboard
│   │   │       ├── AdminCustomers.jsx # Customer management
│   │   │       └── [29 more]         # Other admin pages
│   │   ├── services/                 # API services
│   │   │   ├── api.js                # Axios instance & interceptors
│   │   │   └── socket.js             # Socket.IO client
│   │   ├── utils/                    # Utility functions
│   │   ├── App.jsx                   # Main app component
│   │   ├── main.jsx                  # React entry point
│   │   └── index.css                 # Global styles
│   ├── public/                       # Static assets
│   │   └── brands/                   # Brand logo images
│   ├── vite.config.js                # Vite configuration
│   ├── package.json                  # Dependencies
│   └── .env.local                    # Frontend env vars
│
├── cons2-temp/                       # Temporary/backup folder
├── uploads/                          # Server file storage
├── [Documentation Files]             # Guide & implementation docs
├── startup.ps1                       # Manual startup script
├── full-startup.ps1                  # Automated startup script
└── README.md                         # Project readme
```

---

## 🚀 Key Features & Implementation Status

### ✅ Customer Features (COMPLETE)

| Feature | Status | Details |
|---------|--------|---------|
| **User Registration** | ✅ Complete | Email/password + Google OAuth |
| **Product Browsing** | ✅ Complete | 9+ categories with filters |
| **Search & Filter** | ✅ Complete | By price, category, specs |
| **Dynamic Specs** | ✅ Complete | Category-specific product details |
| **Shopping Cart** | ✅ Complete | Persistent, real-time updates |
| **Checkout Flow** | ✅ Complete | Multi-step with validation |
| **Payment Integration** | ✅ Complete | Razorpay + UPI support |
| **Order Management** | ✅ Complete | View, track, cancel orders |
| **Order History** | ✅ Complete | Detailed order view with invoices |
| **User Profile** | ✅ Complete | **Just Fixed!** (Profile data refresh) |
| **Easy Return** | ✅ Complete | Refund requests & tracking |
| **Product Reviews** | ✅ Complete | Rate & comment on purchases |
| **Services** | ✅ Complete | Browse & inquire about services |
| **Support Messaging** | ✅ Complete | Real-time chat with admins |
| **Forgot Password** | ✅ Complete | Email-based reset |

### ✅ Admin Features (COMPLETE)

| Feature | Status | Details |
|---------|--------|---------|
| **Admin Login** | ✅ Complete | Secure JWT authentication |
| **RBAC System** | ✅ Complete | MAIN_ADMIN vs SUB_ADMIN roles |
| **Dashboard** | ✅ Complete | Real-time stats & analytics |
| **Product Management** | ✅ Complete | CRUD with image upload |
| **Order Management** | ✅ Complete | Status updates, order details |
| **Customer Management** | ✅ Complete | View, block, suspend users |
| **Report System** | ✅ Complete | 5 report types with auto-save |
| **Sales Reports** | ✅ Complete | Revenue, orders, trends |
| **Stock Reports** | ✅ Complete | Inventory tracking |
| **Customer Reports** | ✅ Complete | User analytics |
| **Payment Reports** | ✅ Complete | Transaction details |
| **Order Reports** | ✅ Complete | Order status breakdown |
| **Contact Inbox** | ✅ Complete | Customer inquiries |
| **Refund Requests** | ✅ Complete | Manage returns |
| **Real-Time Messaging** | ✅ Complete | WebSocket-based notifications |
| **Admin Management** | ✅ Complete | MAIN_ADMIN only, manage accounts |

### ✅ Technical Features (COMPLETE)

| Feature | Status | Details |
|---------|--------|---------|
| **JWT Authentication** | ✅ Complete | Secure token-based auth |
| **Password Hashing** | ✅ Complete | Bcryptjs with salt |
| **Socket.IO Integration** | ✅ Complete | Real-time messaging |
| **WebSocket Messaging** | ✅ Complete | Admin-to-customer reports |
| **Email System** | ✅ Complete | Nodemailer configured |
| **File Upload** | ✅ Complete | Product images via Multer |
| **Global Toast System** | ✅ Complete | Professional notifications |
| **API Interceptors** | ✅ Complete | Token management & errors |
| **Error Handling** | ✅ Complete | Comprehensive error responses |
| **CORS Configuration** | ✅ Complete | Production-ready setup |

---

## 🔌 API Architecture

### Authentication Endpoints
```
POST   /api/auth/register           → Register new user
POST   /api/auth/login              → Customer login
POST   /api/auth/admin/login        → Admin login
POST   /api/auth/google             → Google OAuth
POST   /api/auth/forgot-password    → Password reset
POST   /api/auth/logout             → Logout
GET    /api/auth/me                 → Get current user
```

### Product Endpoints
```
GET    /api/products                → All products (with filters)
GET    /api/products/:id            → Product details
POST   /api/products                → Create product (admin)
PUT    /api/products/:id            → Update product (admin)
DELETE /api/products/:id            → Delete product (admin)
GET    /api/products/specifications/schemas → Get spec schemas
```

### Order Endpoints
```
GET    /api/orders                  → User orders
POST   /api/orders                  → Create order
GET    /api/orders/:orderId         → Order details
PUT    /api/orders/:orderId         → Update order (admin)
POST   /api/orders/:orderId/cancel  → Cancel order
```

### Admin Endpoints
```
GET    /api/admin/reports/sales     → Sales report
GET    /api/admin/reports/stock     → Stock report
GET    /api/admin/reports/payments  → Payment report
GET    /api/admin/reports/customers → Customer report
GET    /api/admin/reports/orders    → Order report
POST   /api/admin/reports/generate  → Generate report
GET    /api/admin/customers         → All customers
GET    /api/admin/orders            → All orders
```

### User Endpoints
```
GET    /api/users/profile           → Get profile
PUT    /api/users/profile           → Update profile
PUT    /api/users/password          → Change password
```

---

## 🔐 Authentication & Authorization

### Token Management
- **JWT Tokens**: Stored in localStorage
- **User Token**: For customer APIs
- **Admin Token**: For admin APIs
- **Automatic Expiry**: Configured on backend
- **Refresh Mechanism**: Via re-authentication

### Role-Based Access Control (RBAC)
```
MAIN_ADMIN (manielectricals@gmail.com)
├── Full access to all features
├── Can manage admin accounts
├── Can view all reports
└── Can manage all orders

SUB_ADMIN (Other admin emails)
├── Store operations only
├── Cannot manage admins
├── Cannot access admin management
└── Can view reports
```

### API Interceptors
- **Request**: Automatically adds auth token
- **Response**: Handles 401/403 errors
- **Token Selection**: Routes determine which token to use
- **Error Handling**: Graceful fallback & logout on expiry

---

## 📊 Database Models

### User Collection
- Authentication (email, password, googleId)
- Profile (name, phone, address)
- Status (active, suspended, blocked)
- Orders reference
- Reviews reference

### Admin Collection
- Authentication (email, password)
- Role (MAIN_ADMIN, SUB_ADMIN)
- Status (active, disabled)
- Creation timestamp

### Product Collection
- Basic info (name, category, price, stock)
- Images
- Specifications (dynamic by category)
- Reviews reference
- Category classification

### Order Collection
- Customer reference
- Items list (products, quantities, prices)
- Payment info (status, method, razorpay ID)
- Shipping address
- Status tracking (pending, processing, shipped, delivered)
- Invoice

### Report Collections
- **Report**: Schema & template storage
- **GeneratedReport**: Snapshots of generated reports
- **ReportMessage**: Admin messages to users

### Other Collections
- Cart, Contact, Service, Return, Review, ReportMessage

---

## 🚀 Deployment Status

### ✅ Production-Ready Services
- **Backend**: Render.com (Configured)
- **Frontend**: Vercel (Configured)
- **Database**: MongoDB Atlas (Cloud)
- **Email**: Nodemailer (Configured)
- **Payments**: Razorpay (Production Account)

### Environment Configuration
```bash
# Backend (.env)
MONGO_URI=<your_atlas_connection>
JWT_SECRET=<your_secret_key>
PORT=50004
GOOGLE_CLIENT_ID=<google_credentials>
RAZORPAY_KEY_ID=<razorpay_key>
RAZORPAY_KEY_SECRET=<razorpay_secret>

# Frontend (.env.local)
VITE_API_URL=http://localhost:50004 (dev) or production URL
VITE_GOOGLE_CLIENT_ID=<google_credentials>
```

---

## 🔧 Development Setup

### Quick Start
```bash
# Automated startup (Windows PowerShell)
.\full-startup.ps1

# Manual: Terminal 1 - Backend
cd backend
npm run dev

# Manual: Terminal 2 - Frontend (wait for backend to be ready)
cd frontend
npm run dev
```

### Port Configuration
- **Backend API**: 50004
- **Frontend App**: 3003
- **Frontend Proxy**: `/api` → `http://localhost:50004`

---

## 📝 Recent Fixes & Improvements

### ✅ Profile Data Refresh Fix (Just Complete)
**Issue**: Profile updates not reflecting on page after saving  
**Solution**: 
- Created `refreshUser()` method in AuthContext
- Profile component now fetches fresh data after update
- Added useEffect to sync form with context data
- **Result**: Instant profile updates without page reload

[See: PROFILE_UPDATE_FIX_GUIDE.md](../PROFILE_UPDATE_FIX_GUIDE.md)

### ✅ RBAC Implementation
- Email-based automatic role assignment
- MAIN_ADMIN vs SUB_ADMIN distinction
- Admin management restricted to MAIN_ADMIN

### ✅ WebSocket Real-Time Messaging
- Admin-to-customer report messages
- Socket.IO integration with Express
- Auto-fill form data in messages
- Real-time notifications

### ✅ Dynamic Product Specifications
- Category-specific spec schemas
- Flexible product specifications
- Auto-validation and formatting
- 9+ product categories supported

### ✅ Complete Report System
- 5 report types (Sales, Stock, Payments, Customers, Orders)
- Auto-save to MongoDB
- Report history tracking
- Advanced filtering & analytics

---

## 🛠️ Common Development Tasks

### Add New Product Category
1. Add to specification schemas: `backend/config/specificationSchemas.js`
2. Update Product model if needed
3. Add UI form in ProductAdd/Edit pages

### Add New Report Type
1. Create endpoint in `backend/controllers/reportController.js`
2. Add route in `backend/routes/reportRoutes.js`
3. Create frontend page in `frontend/src/pages/admin/`
4. Add route in `frontend/src/App.jsx`

### Fix Data Consistency Issues
Pattern (as seen in Profile fix):
1. Update backend data
2. Fetch fresh data from backend
3. Update context state (not just localStorage)
4. Use useEffect to keep UI synchronized

### Add New Authentication Feature
1. Add endpoint in `backend/controllers/authController.js`
2. Add route in `backend/routes/authRoutes.js`
3. Update AuthContext in `frontend/src/context/AuthContext.jsx`
4. Call context method in component where needed

---

## 📞 Support & Contact

- **Admin Email**: manielectricals@gmail.com
- **Main Repo**: GitHub (deployment-ready versions)
- **Production URLs**:
  - Frontend: https://manielectrical.vercel.app
  - Backend: https://manielectrical-backend.onrender.com

---

## 📋 Documentation Reference

| Document | Purpose |
|----------|---------|
| [PROFILE_UPDATE_FIX_GUIDE.md](../PROFILE_UPDATE_FIX_GUIDE.md) | Profile data refresh implementation |
| [COMPLETE_REPORT_SYSTEM_GUIDE.md](../COMPLETE_REPORT_SYSTEM_GUIDE.md) | Report system architecture |
| [DYNAMIC_SPECIFICATION_SYSTEM_COMPLETE.md](../DYNAMIC_SPECIFICATION_SYSTEM_COMPLETE.md) | Product specs system |
| [WEBSOCKET_IMPLEMENTATION_SUMMARY.md](../WEBSOCKET_IMPLEMENTATION_SUMMARY.md) | Real-time messaging |
| [RBAC_IMPLEMENTATION_CHECKLIST.txt](../RBAC_IMPLEMENTATION_CHECKLIST.txt) | Role-based access control |
| [SETUP_INSTRUCTIONS.md](../SETUP_INSTRUCTIONS.md) | Initial setup & MongoDB fix |
| [STARTUP_GUIDE.md](../STARTUP_GUIDE.md) | How to start the project |

---

**Generated**: March 6, 2026 | **Status**: Active Development
