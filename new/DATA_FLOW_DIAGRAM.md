# DATA FLOW DIAGRAM (DFD)

## Electric Shop E-Commerce System - DFD Level 0, Level 1

```
═══════════════════════════════════════════════════════════════════════════════════
                      DFD LEVEL 0 (CONTEXT DIAGRAM)
═══════════════════════════════════════════════════════════════════════════════════

                          External Entities & Data Flows:


                    ┌─────────────────────────────────────┐
                    │        EXTERNAL ENTITIES            │
                    └─────────────────────────────────────┘

                ┌──────────┐         ┌──────────────┐
                │ CUSTOMER │         │   ADMIN      │
                │  (User)  │         │  (Manager)   │
                └────┬─────┘         └──────┬───────┘
                     │                      │
      ┌──────────────┼──────────────────────┼──────────────┐
      │              │                      │              │
      │   1. Browse  │ 2. Manage            │ 3. Report    │
      │   Products   │    Products & Orders │    Requests  │
      │              │                      │              │
      │   4. Auth    │ 5. Manage            │ 6. Alerts    │
      │   Requests   │    Orders            │              │
      │              │                      │              │
      ▼              ▼                      ▼              ▼
    ┌────────────────────────────────────────────────────────┐
    │                                                          │
    │     ELECTRIC SHOP E-COMMERCE SYSTEM                    │
    │                                                          │
    │  [0] Main Processing System                            │
    │   - User Authentication                               │
    │   - Product Catalog Management                        │
    │   - Shopping Cart & Order Processing                  │
    │   - Payment Gateway Integration                       │
    │   - Inventory Management                              │
    │   - Notification System                               │
    │                                                          │
    └────────┬─────────────────────────────────┬────────────┘
             │                                 │
             │   7. Order Confirmation         │ 8. Product Data
             │   8. Notifications              │ 9. Reports
             │   10. Invoices                  │
             │                                 │
             ▼                                 ▼
         ┌──────────────────┐         ┌──────────────────┐
         │  EMAIL SERVICE   │         │  DATABASE        │
         │  (Notification)  │         │  (Storage)       │
         └──────────────────┘         └──────────────────┘
             │
             ▼
         ┌──────────────────┐
         │ PAYMENT GATEWAY  │
         │ (Razorpay/Stripe)│
         └──────────────────┘


═══════════════════════════════════════════════════════════════════════════════════
                      DFD LEVEL 1 (DETAILED PROCESSES)
═══════════════════════════════════════════════════════════════════════════════════

                    ┌──────────────────────────────────┐
                    │     SYSTEM BOUNDARY              │
                    │  ELECTRIC SHOP E-COMMERCE       │
                    │                                   │
    ┌───────────────────────────────────────────────────────────────────┐
    │                                                                   │
    │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
    │  │  PROCESS 1   │  │  PROCESS 2   │  │  PROCESS 3   │            │
    │  │    AUTH      │  │  PRODUCT MGT │  │ CART & ORDER │            │
    │  └──────────────┘  └──────────────┘  └──────────────┘            │
    │  │              │  │              │  │              │            │
    │  │ • Register   │  │ • View Prod  │  │ • Add Cart   │            │
    │  │ • Login      │  │ • Search     │  │ • View Cart  │            │
    │  │ • Verify     │  │ • Filter     │  │ • Checkout   │            │
    │  │   Email      │  │ • Get Detail │  │ • Place Ord  │            │
    │  │ • Password   │  │              │  │              │            │
    │  │   Reset      │  │              │  │              │            │
    │  └──────────────┘  └──────────────┘  └──────────────┘            │
    │       ▲                 ▲                   ▲                     │
    │       │                 │                   │                     │
    │       │                 │                   │                     │
    │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
    │  │  PROCESS 4   │  │  PROCESS 5   │  │  PROCESS 6   │            │
    │  │  PAYMENT     │  │  ORDER MGT   │  │ INVENTORY    │            │
    │  └──────────────┘  └──────────────┘  └──────────────┘            │
    │  │              │  │              │  │              │            │
    │  │ • Process    │  │ • View Ord   │  │ • Update Qty │            │
    │  │   Payment    │  │ • Update Sta │  │ • Check Stock│            │
    │  │ • Validate   │  │ • Track Ord  │  │ • Reorder    │            │
    │  │   Payment    │  │ • Cancel Ord │  │              │            │
    │  │ • Refund     │  │ • Review     │  │              │            │
    │  │              │  │              │  │              │            │
    │  └──────────────┘  └──────────────┘  └──────────────┘            │
    │       ▲                 ▲                   ▲                     │
    │       │                 │                   │                     │
    │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
    │  │  PROCESS 7   │  │  PROCESS 8   │  │  DATA STORE  │            │
    │  │NOTIFICATION │  │   REPORTS    │  │    (D1-D5)   │            │
    │  └──────────────┘  └──────────────┘  └──────────────┘            │
    │  │              │  │              │  │              │            │
    │  │ • Send Email │  │ • Sales Rep  │  │ D1: Users    │            │
    │  │ • Send SMS   │  │ • Inventory  │  │ D2: Products │            │
    │  │ • Push Notif │  │ • Customer   │  │ D3: Orders   │            │
    │  │              │  │   Reports    │  │ D4: Carts    │            │
    │  │              │  │ • Analytics  │  │ D5: Payment  │            │
    │  │              │  │              │  │              │            │
    │  └──────────────┘  └──────────────┘  └──────────────┘            │
    │                                                                   │
    └───────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │ EMAIL        │  │ PAYMENT      │  │ DATABASE     │
            │ SERVICE      │  │ GATEWAY      │  │              │
            └──────────────┘  └──────────────┘  └──────────────┘


═══════════════════════════════════════════════════════════════════════════════════
                    DFD LEVEL 1 - DETAILED DATA FLOWS
═══════════════════════════════════════════════════════════════════════════════════

DATA FLOW TERMINOLOGY:
┌─────────────┬──────────────────────────────────────────────────────┐
│ DF1-DF50    │ Customer Registration → Validation → Store in DB     │
├─────────────┼──────────────────────────────────────────────────────┤
│ DF2-DF20    │ Login Request → Authentication → JWT Token Response  │
├─────────────┼──────────────────────────────────────────────────────┤
│ DF3-DF35    │ Browse Products Request → Query DB → Return Results  │
├─────────────┼──────────────────────────────────────────────────────┤
│ DF4-DF45    │ Add to Cart → Update Cart Record → Calculate Total   │
├─────────────┼──────────────────────────────────────────────────────┤
│ DF5-DF55    │ Checkout Request → Validate → Payment Processing     │
├─────────────┼──────────────────────────────────────────────────────┤
│ DF6-DF65    │ Payment Response → Create Order → Send Confirmation  │
├─────────────┼──────────────────────────────────────────────────────┤
│ DF7-DF75    │ Admin Product Mgmt → Validate → Update Database      │
├─────────────┼──────────────────────────────────────────────────────┤
│ DF8-DF85    │ Order Status Update → Notify Customer → Log Change   │
├─────────────┼──────────────────────────────────────────────────────┤
│ DF9-DF95    │ Inventory Check → Update Stock → Alert if Low        │
├─────────────┼──────────────────────────────────────────────────────┤
│ DF10-DF105  │ Report Generation → Query Analytics → Export Results │
└─────────────┴──────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                         DETAILED PROCESS FLOWS                               │
└──────────────────────────────────────────────────────────────────────────────┘

PROCESS 1: USER AUTHENTICATION
───────────────────────────────

Input Data:
    Email, Password, Phone (Registration)
    Email, Password (Login)

Processing Steps:
    1. Validate email format
    2. Check email uniqueness
    3. Hash password with bcrypt
    4. Store/Verify credentials
    5. Generate JWT token
    6. Send verification email

Output Data:
    JWT Token, User ID, Verification Status
    Error messages (if validation fails)

Data Store Interactions:
    DF1: Email & Password → D1 (Users Table)
    DF2: User Data ← D1 (Query User)
    DF3: JWT Token ← Auth System

External Interactions:
    Email Service: Verification code


PROCESS 2: PRODUCT MANAGEMENT
──────────────────────────────

Input Data (Customer):
    Search query, Filter criteria, Category

Input Data (Admin):
    Product name, price, description, stock, image, specifications

Processing Steps:
    1. Parse search/filter criteria
    2. Query product database
    3. Apply filters (category, price range, brand)
    4. Sort results
    5. Paginate results
    6. (Admin) Validate product data
    7. (Admin) Store/Update product record

Output Data:
    Product list with details
    Product details (full information)
    Success/Error messages

Data Store Interactions:
    DF4: Search query → Process → DF5: Query results ← D2 (Products)
    DF6: Product data → D2 (Add/Update/Delete)


PROCESS 3: CART & ORDER PROCESSING
───────────────────────────────────

Input Data:
    Product ID, Quantity, User ID
    Shipping address, Payment method

Processing Steps:
    1. Validate product exists and in stock
    2. Get current price from D2
    3. Add/update cart item
    4. Calculate cart total
    5. Apply discounts/coupons
    6. Calculate tax
    7. Create order record

Output Data:
    Cart summary, Order ID, Confirmation details
    Error messages

Data Store Interactions:
    DF7: Add to Cart → D4 (Carts table)
    DF8: Checkout data → D3 (Orders table)
    DF9: Inventory check ← D2 (Products)


PROCESS 4: PAYMENT PROCESSING
──────────────────────────────

Input Data:
    Order ID, Amount, Payment method, Card/UPI details

Processing Steps:
    1. Validate payment method
    2. Prepare payment request
    3. Call payment gateway API
    4. Wait for payment response
    5. Validate response
    6. Update order status
    7. Handle refunds if needed

Output Data:
    Payment status (success/failed), Transaction ID
    Receipt data

Data Store Interactions:
    DF10: Payment request → Payment Gateway
    DF11: Payment response ← Payment Gateway
    DF12: Update order → D3 (Orders)
    DF13: Payment record → D5 (Payment table)


PROCESS 5: ORDER MANAGEMENT
────────────────────────────

Input Data (Customer):
    Order ID (to view), Cancel request, Review/Rating

Input Data (Admin):
    Order ID, New status, Tracking number

Processing Steps:
    1. Query order from database
    2. Validate user authorization
    3. (Admin) Update status
    4. Check order fulfillment rules
    5. Generate tracking number
    6. Create shipment record
    7. Log status changes

Output Data:
    Order details, Status, Tracking info
    Shipment confirmation

Data Store Interactions:
    DF14: Query order ← D3 (Orders)
    DF15: Update status → D3
    DF16: Log change → D3

External Interactions:
    Send notifications, Update inventory


PROCESS 6: INVENTORY MANAGEMENT
────────────────────────────────

Input Data:
    Product ID, Quantity changes, Reorder levels

Processing Steps:
    1. Query current stock
    2. Update stock quantity
    3. Check if below reorder level
    4. Generate alerts if needed
    5. Track stock history

Output Data:
    Updated stock level, Alerts, Reorder requests

Data Store Interactions:
    DF17: Stock query ← D2 (Products)
    DF18: Update stock → D2
    DF19: Alert log → D2


PROCESS 7: NOTIFICATION SYSTEM
───────────────────────────────

Input Data:
    Event trigger (order placed, payment success, etc.)
    User email, Phone number

Processing Steps:
    1. Identify event type
    2. Generate message template
    3. Populate with order/user data
    4. Send via email service
    5. Log notification

Output Data:
    Confirmation of sent notification
    Bounce/delivery status

External Service:
    Email Service API call


PROCESS 8: REPORTS & ANALYTICS
───────────────────────────────

Input Data:
    Date range, Filter criteria, Report type

Processing Steps:
    1. Query required data
    2. Aggregate/Summarize
    3. Calculate metrics
    4. Format report
    5. Export (PDF/Excel)

Output Data:
    Sales reports, Inventory reports, Customer insights
    Analytics dashboard data

Data Store Interactions:
    DF20: Query orders ← D3
    DF21: Query products ← D2
    DF22: Query users ← D1


═══════════════════════════════════════════════════════════════════════════════════
                            DATA STORES (D1-D5)
═══════════════════════════════════════════════════════════════════════════════════

D1: USERS TABLE (MongoDB Collection: users)
─────────────────────────────────────────────
Fields: userId, name, email, password, phone, address, role, 
        isEmailVerified, lastLogin, createdAt

D2: PRODUCTS TABLE (MongoDB Collection: products)
──────────────────────────────────────────────────
Fields: productId, name, description, price, category, brand,
        image, stock, specifications, ratings, createdAt, updatedAt

D3: ORDERS TABLE (MongoDB Collection: orders)
──────────────────────────────────────────────
Fields: orderId, orderNumber, userId, items[], shippingAddress,
        paymentMethod, paymentStatus, trackingNumber, totalPrice,
        orderDate, status, updatedAt

D4: CARTS TABLE (MongoDB Collection: carts)
─────────────────────────────────────────────
Fields: cartId, userId, items[], totalAmount, createdAt, updatedAt

D5: PAYMENTS TABLE (MongoDB Collection: payments)
──────────────────────────────────────────────────
Fields: paymentId, orderId, amount, method, transactionId,
        status, gateway, createdAt, refundStatus


═══════════════════════════════════════════════════════════════════════════════════
                         DATA FLOW SUMMARY TABLE
═══════════════════════════════════════════════════════════════════════════════════

┌────┬─────────────────────────────────┬─────────────────┬────────────────┐
│ ID │ Data Flow Name                  │ From            │ To             │
├────┼─────────────────────────────────┼─────────────────┼────────────────┤
│DF1 │ Registration Request            │ Customer        │ Process 1      │
│DF2 │ Login Credentials               │ Customer        │ Process 1      │
│DF3 │ JWT Token Response              │ Process 1       │ Customer       │
│DF4 │ Search/Filter Request           │ Customer        │ Process 2      │
│DF5 │ Product List Response           │ Process 2       │ Customer       │
│DF6 │ Product Details Request         │ Customer        │ Process 2      │
│DF7 │ Add to Cart Request             │ Customer        │ Process 3      │
│DF8 │ Checkout Request                │ Customer        │ Process 3      │
│DF9 │ Stock Check Query               │ Process 3       │ D2             │
│DF10│ Payment Request                 │ Process 4       │ Payment Gate   │
│DF11│ Payment Response                │ Payment Gate    │ Process 4      │
│DF12│ Order Confirmation              │ Process 4       │ Customer       │
│DF13│ Payment Record Store            │ Process 4       │ D5             │
│DF14│ Order Details Query             │ Customer        │ Process 5      │
│DF15│ Order Status Update             │ Admin           │ Process 5      │
│DF16│ Tracking Info Response          │ Process 5       │ Customer       │
│DF17│ Stock Update Request            │ Process 6       │ D2             │
│DF18│ Low Stock Alert                 │ Process 6       │ Admin          │
│DF19│ Notification Trigger            │ Multiple        │ Process 7      │
│DF20│ Email Confirmation              │ Process 7       │ Email Service  │
│DF21│ Report Generation Request       │ Admin           │ Process 8      │
│DF22│ Report Data Response            │ Process 8       │ Admin          │
└────┴─────────────────────────────────┴─────────────────┴────────────────┘

```

