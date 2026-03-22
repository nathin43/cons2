# SYSTEM FLOW DIAGRAM

## Complete System Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ELECTRIC SHOP E-COMMERCE SYSTEM FLOW                          │
└─────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════
                           USER AUTHENTICATION FLOW
═══════════════════════════════════════════════════════════════════════════════════

    ┌──────────────────────────────────────────────────────────────────┐
    │                    START: USER LANDING PAGE                      │
    └──────────────┬───────────────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────────┐
        │                     │                  │
        ▼                     ▼                  ▼
    ┌────────────┐      ┌──────────────┐   ┌─────────────┐
    │   LOGIN    │      │   REGISTER   │   │ FORGOT PWD  │
    └────────────┘      └──────────────┘   └─────────────┘
        │                     │                  │
        │ Email & Password    │ Email, Password, │
        │ validation          │ Phone            │
        │                     │                  │
        ▼                     ▼                  ▼
    ┌────────────┐      ┌──────────────┐   ┌─────────────┐
    │ Verify     │      │ Verify Email │   │ Send OTP    │
    │ Credentials│      │ with OTP     │   │ to Email    │
    └────────────┘      └──────────────┘   └─────────────┘
        │                     │                  │
        ├─────────────────────┴──────────────────┤
        │                                        │
        ▼                                        │
    ┌────────────┐                              │
    │ Valid?     │                              │
    └────────────┘                              │
        │ YES          │ NO                      │
        │              ▼                        │
        │          ┌──────────────┐            │
        │          │ Error Message│            │
        │          └──────────────┘            │
        │              │                        │
        │              └──────────────────────┐ │
        │                                     │ │
        ▼                                     ▼ ▼
    ┌────────────────┐              ┌──────────────────┐
    │ Generate JWT   │              │ Redirect to Form │
    │ Token          │              │ or Login         │
    └────────────────┘              └──────────────────┘
        │
        ▼
    ┌────────────────────┐
    │ Store Token in     │
    │ LocalStorage/Cookie│
    └────────────────────┘
        │
        ▼
    ┌────────────────────┐
    │ Redirect to Home   │
    │ or Dashboard       │
    └────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════
                        CUSTOMER SHOPPING FLOW
═══════════════════════════════════════════════════════════════════════════════════

    ┌──────────────────────────────────────────────────────────────┐
    │              HOME PAGE / PRODUCT CATALOG                     │
    └──────────────┬────────────────────────────────────────────────┘
                   │
                   ├─────────────┬──────────────┬──────────────┐
                   │             │              │              │
                   ▼             ▼              ▼              ▼
            ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
            │ Browse by │  │ Search   │  │ Filter by│  │ Sort by  │
            │ Category  │  │ Products │  │ Price/   │  │ Rating/  │
            │           │  │          │  │ Brand    │  │ Popularity
            └───────────┘  └──────────┘  └──────────┘  └──────────┘
                   │             │              │              │
                   └─────────────┴──────────────┴──────────────┘
                                  │
                                  ▼
                        ┌──────────────────────┐
                        │ Display Product List │
                        │ - Images             │
                        │ - Prices             │
                        │ - Ratings            │
                        │ - Availability       │
                        └──────────────────────┘
                                  │
                                  ▼
                        ┌──────────────────────┐
                        │ User Clicks Product  │
                        └──────────────────────┘
                                  │
                                  ▼
                        ┌──────────────────────┐
                        │ PRODUCT DETAILS PAGE │
                        │ - Full Description   │
                        │ - Specifications     │
                        │ - Reviews & Ratings  │
                        │ - Stock Status       │
                        └──────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
            ┌──────────────┐          ┌──────────────────┐
            │ Add to Cart  │          │ Add to Wishlist  │
            │ - Qty Selection          │                  │
            │ - Price Updated          │ (Save for later) │
            └──────────────┘          └──────────────────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                        ┌──────────────────────┐
                        │ Redirect to Continue │
                        │ Shopping or Checkout │
                        └──────────────────────┘
                                  │
                    ┌─────────────┴──────────────┐
                    │                            │
                    ▼                            ▼
            ┌─────────────────┐      ┌──────────────────┐
            │ Continue Shopping   │    │ Go to Cart       │
            │ (Browse More)       │    │                  │
            └─────────────────┘      └──────────────────┘
                    │                            │
                    └─────────────┬──────────────┘
                                  │
                                  ▼
                        ┌──────────────────────┐
                        │ SHOPPING CART PAGE   │
                        │ - All Cart Items     │
                        │ - Qty Adjustments    │
                        │ - Remove Items       │
                        │ - Total Price        │
                        └──────────────────────┘
                                  │
                                  ▼
                        ┌──────────────────────┐
                        │ Proceed to Checkout? │
                        └──────────────────────┘
                                  │
                    ┌─────────────┴────────────┐
                    │ YES                      │ NO
                    ▼                          ▼
            ┌──────────────────┐    ┌──────────────────┐
            │ CHECKOUT PAGE    │    │ Continue Shopping│
            │ - Confirm Items  │    │ (Redirect Home)  │
            │ - Shipping Addr  │    └──────────────────┘
            │ - Payment Method │
            │ - Apply Coupon   │
            └──────────────────┘
                    │
                    ▼
            ┌──────────────────┐
            │ Validate Address │
            └──────────────────┘
                    │
                    ├─ Valid ──┐
                    │          │ Invalid
                    │          ▼
                    │  ┌──────────────┐
                    │  │ Error Message│
                    │  └──────────────┘
                    │          │
                    │  ┌───────┘
                    │  │
                    ▼  ▼
            ┌──────────────────┐
            │ Select Payment   │
            │ Method           │
            │ - COD            │
            │ - Card           │
            │ - UPI            │
            │ - NetBanking     │
            └──────────────────┘
                    │
                    ▼
            ┌──────────────────┐
            │ Review Order     │
            │ Summary          │
            │ - Items          │
            │ - Total Price    │
            │ - Shipping Cost  │
            │ - Discount       │
            └──────────────────┘
                    │
                    ▼
            ┌──────────────────┐
            │ Place Order      │
            │ (Confirm)        │
            └──────────────────┘
                    │
                    ▼
            ┌──────────────────┐
            │ Process Payment  │
            │ (Gateway Call)   │
            └──────────────────┘
                    │
        ┌───────────┴────────────┐
        │ SUCCESS     FAILURE     │
        ▼                        ▼
    ┌──────────┐        ┌──────────────────┐
    │ Create   │        │ Payment Failed   │
    │ Order    │        │ Retry or Refund  │
    └──────────┘        └──────────────────┘
        │                        │
        ▼                        ▼
    ┌──────────────────┐  ┌──────────────────┐
    │ Order Confirmed  │  │ Show Error Msg   │
    │ Page             │  │ Redirect to Cart │
    │ - Order Number   │  └──────────────────┘
    │ - Tracking Info  │
    │ - Delivery Date  │
    └──────────────────┘
        │
        ▼
    ┌──────────────────┐
    │ Send Email       │
    │ Confirmation     │
    └──────────────────┘


═══════════════════════════════════════════════════════════════════════════════════
                      ADMIN PRODUCT MANAGEMENT FLOW
═══════════════════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────┐
    │ ADMIN LOGIN                 │
    │ Email & Password            │
    └─────────────┬───────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Authenticate   │
         │ Admin User     │
         └────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ ADMIN DASHBOARD│
         └─────┬──────────┘
               │
    ┌──────────┼──────────┬──────────┐
    │          │          │          │
    ▼          ▼          ▼          ▼
┌─────────┐┌──────┐┌──────┐┌────────┐
│Products ││Orders││Custms││Reports │
└─────────┘└──────┘└──────┘└────────┘
    │
    ▼
┌──────────────────────┐
│ PRODUCT MANAGEMENT   │
│ - Add Product        │
│ - Edit Product       │
│ - Delete Product     │
│ - View All Products  │
└──────────────────────┘
    │
    ├─────┬──────┬─────────┐
    │     │      │         │
    ▼     ▼      ▼         ▼
  ┌──┐ ┌──┐  ┌───┐   ┌─────┐
  │Add│ │Edit│  │Del│   │View│
  └──┘ └──┘  └───┘   └─────┘
    │     │      │      │
    ▼     ▼      ▼      ▼
┌─────────────────────────────┐
│ Form / Confirmation Dialog  │
│ - Name, Price, Category     │
│ - Stock, Brand, Image       │
│ - Specifications            │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ Validate Input              │
│ - Required Fields           │
│ - Price > 0, Stock ≥ 0      │
└─────────────────────────────┘
    │
    ├─ Valid ──┐
    │          │ Invalid
    │          ▼
    │    ┌──────────┐
    │    │Error Msg │
    │    └──────────┘
    │          │
    │    ┌─────┘
    │    │
    ▼    ▼
┌──────────────────────────────┐
│ Update Database              │
│ - Save/Update Product Record │
│ - Update Stock               │
│ - Update Last Modified Date  │
└──────────────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│ Show Success Message         │
│ Redirect to Product List     │
└──────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════
                      ORDER MANAGEMENT FLOW
═══════════════════════════════════════════════════════════════════════════════════

    ┌──────────────────────┐
    │ NEW ORDER RECEIVED   │
    │ (Customer Checkout)  │
    └──────────┬───────────┘
               │
               ▼
         ┌─────────────────┐
         │ Create Order    │
         │ Record (pending)│
         └─────────────────┘
               │
               ▼
         ┌─────────────────┐
         │ Send Email to   │
         │ Customer        │
         └─────────────────┘
               │
               ▼
         ┌─────────────────┐
         │ ADMIN REVIEWS   │
         │ ORDERS          │
         └─────────────────┘
               │
               ▼
         ┌─────────────────┐
         │ Verify Payment  │
         │ Status          │
         └─────────────────┘
               │
    ┌──────────┴──────────┐
    │ CONFIRMED  FAILED   │
    ▼                     ▼
┌────────────┐      ┌──────────────┐
│ Confirm    │      │ Notify       │
│ Order      │      │ Customer     │
│ (pending→  │      │ Payment Failed
│ confirmed) │      └──────────────┘
└────────────┘
    │
    ▼
┌────────────────────┐
│ Reserve Stock      │
│ Decrement Inventory│
└────────────────────┘
    │
    ▼
┌────────────────────┐
│ Prepare Shipment   │
│ (confirmed→shipped)│
└────────────────────┘
    │
    ▼
┌────────────────────┐
│ Generate Tracking# │
│ Send to Customer   │
└────────────────────┘
    │
    ▼
┌────────────────────┐
│ In Transit         │
│ Customer can track │
└────────────────────┘
    │
    ▼
┌────────────────────┐
│ Delivered         │
│ (shipped→delivered)│
└────────────────────┘
    │
    ▼
┌────────────────────┐
│ Update Order Status│
│ Final: completed   │
│ Send Email Receipt │
└────────────────────┘
    │
    ▼
┌────────────────────┐
│ Allow Customer     │
│ Rating/Review      │
└────────────────────┘
```

## System Flow Summary:

1. **Authentication Flow**: User Registration → Email Verification → Login → JWT Token Generation
2. **Shopping Flow**: Browse Products → View Details → Add to Cart → Checkout → Payment → Order Created
3. **Admin Flow**: Login → Dashboard → Manage Products/Orders/Customers → Update Status → Send Notifications
4. **Order Fulfillment**: Order Received → Payment Verified → Stock Reserved → Shipped → Delivered → Complete

