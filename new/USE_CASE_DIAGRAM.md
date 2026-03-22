# USE CASE DIAGRAM

## Electric Shop E-Commerce System - Use Cases

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         ELECTRIC SHOP E-COMMERCE                             │
│                          USE CASE DIAGRAM (v1.0)                             │
└──────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────┐
                    │   ELECTRIC SHOP E-COMMERCE SYSTEM       │
                    │         (Boundary)                       │
                    │                                          │
                    │  ┌─────────────────────────────────┐    │
                    │  │                                 │    │
                    │  │      AUTHENTICATION             │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-1: User Registration  │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-2: User Login         │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-3: Email Verification │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-4: Password Reset     │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │                                 │    │
                    │  └─────────────────────────────────┘    │
                    │                                          │
                    │  ┌─────────────────────────────────┐    │
                    │  │  CUSTOMER SHOPPING             │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-5: Browse Products    │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-6: View Product       │   │    │
                    │  │  │        Details           │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-7: Search Products    │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-8: Filter Products    │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-9: Add to Cart        │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-10: Add to Wishlist   │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │                                 │    │
                    │  └─────────────────────────────────┘    │
                    │                                          │
                    │  ┌─────────────────────────────────┐    │
                    │  │  CART MANAGEMENT               │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-11: View Cart         │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-12: Update Cart       │   │    │
                    │  │  │         Quantity         │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-13: Remove from Cart  │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-14: Clear Cart        │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │                                 │    │
                    │  └─────────────────────────────────┘    │
                    │                                          │
                    │  ┌─────────────────────────────────┐    │
                    │  │  CHECKOUT & PAYMENT            │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-15: Checkout          │   │    │
                    │  │  │ (Enter Shipping Address) │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-16: Select Payment    │   │    │
                    │  │  │         Method           │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-17: Apply Coupon      │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-18: Process Payment   │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-19: Place Order       │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │                                 │    │
                    │  └─────────────────────────────────┘    │
                    │                                          │
                    │  ┌─────────────────────────────────┐    │
                    │  │  ORDER MANAGEMENT              │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-20: View Orders       │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-21: Track Order       │   │    │
                    │  │  │         Status           │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-22: Cancel Order      │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-23: Rate & Review     │   │    │
                    │  │  │         Product          │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │                                 │    │
                    │  └─────────────────────────────────┘    │
                    │                                          │
                    │  ┌─────────────────────────────────┐    │
                    │  │  PROFILE MANAGEMENT            │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-24: View Profile      │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-25: Update Profile    │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-26: Manage Addresses  │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-27: Change Password   │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │                                 │    │
                    │  └─────────────────────────────────┘    │
                    │                                          │
                    │  ┌─────────────────────────────────┐    │
                    │  │  ADMIN FUNCTIONS               │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-28: Admin Login       │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-29: Add Product       │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-30: Edit Product      │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-31: Delete Product    │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-32: View All Orders   │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-33: Update Order      │   │    │
                    │  │  │         Status           │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-34: View Customers    │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │  ┌──────────────────────────┐   │    │
                    │  │  │ UC-35: Generate Reports  │   │    │
                    │  │  └──────────────────────────┘   │    │
                    │  │                                 │    │
                    │  └─────────────────────────────────┘    │
                    │                                          │
                    └──────────────────────────────────────────┘
                                    ▲
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
            ┌────────┐          ┌───────┐          ┌────────┐
            │CUSTOMER│          │ ADMIN │          │SYSTEM  │
            │(Actor) │          │(Actor)│          │(Actor) │
            └────────┘          └───────┘          └────────┘
                (Primary)      (Secondary)       (Supporting)


═══════════════════════════════════════════════════════════════════════════════════
                         USE CASE DETAILS
═══════════════════════════════════════════════════════════════════════════════════

ACTOR 1: CUSTOMER (Primary User)
─────────────────────────────────
- Browse and search for products
- Add/remove items from cart and wishlist
- Checkout and make payments
- Track orders
- Manage profile and addresses
- Rate and review products
- View order history

ACTOR 2: ADMIN (Secondary User)
────────────────────────────────
- Authenticate to admin panel
- Add, edit, delete products
- Manage inventory/stock
- View and process orders
- Update order status and tracking
- View customer information
- Generate sales and analytics reports
- Manage admin permissions (Superadmin only)

ACTOR 3: SYSTEM (Supporting Actor)
──────────────────────────────────
- Send email notifications
- Process payment transactions
- Generate order confirmations
- Calculate taxes and discounts
- Update inventory automatically
- Send SMS/Email notifications
- Generate invoices


═══════════════════════════════════════════════════════════════════════════════════
                    USE CASE RELATIONSHIPS & DEPENDENCIES
═══════════════════════════════════════════════════════════════════════════════════

EXTENSION RELATIONSHIPS:
- UC-5 (Browse Products) <<extends>> UC-6 (View Product Details)
- UC-7 (Search) <<extends>> UC-5 (Browse Products)
- UC-8 (Filter) <<extends>> UC-5 (Browse Products)
- UC-18 (Process Payment) <<extends>> UC-19 (Place Order)
- UC-22 (Cancel Order) <<extends>> UC-20 (View Orders) [conditional]

INCLUSION RELATIONSHIPS:
- UC-19 (Place Order) <<includes>> UC-15 (Checkout)
- UC-19 (Place Order) <<includes>> UC-16 (Select Payment)
- UC-15 (Checkout) <<includes>> UC-2 (User Login) [if not logged in]
- UC-25 (Update Profile) <<includes>> UC-26 (Manage Addresses)
- UC-33 (Update Order Status) <<includes>> System notification


═══════════════════════════════════════════════════════════════════════════════════
                         CRITICAL USE CASE FLOWS
═══════════════════════════════════════════════════════════════════════════════════

UC-19: PLACE ORDER (Main Success Scenario)
───────────────────────────────────────────
1. Customer adds items to cart
2. Customer initiates checkout
3. System displays checkout page
4. Customer enters/confirms shipping address
5. Customer selects payment method
6. Customer applies coupon (optional)
7. System calculates total (items + tax - discount + shipping)
8. Customer reviews order summary
9. Customer confirms order
10. System processes payment via gateway
11. Payment successful:
    a. Create order record in database
    b. Reserve inventory
    c. Generate order number and tracking
    d. Send confirmation email
    e. Clear shopping cart
    f. Redirect to order confirmation page
12. End Use Case

Alternative Flows:
- A1: Payment fails → Show error → Redirect to retry or abandon
- A2: Insufficient stock → Show message → Remove item or wait for restock
- A3: Invalid address → Show validation error → Redirect to correct

UC-33: UPDATE ORDER STATUS (Admin)
───────────────────────────────────
1. Admin logs in
2. Admin navigates to Orders section
3. System displays list of all orders
4. Admin selects an order
5. System shows order details:
   - Items, quantities, prices
   - Shipping address
   - Current status
   - Payment status
   - Tracking information
6. Admin updates status:
   - pending → confirmed
   - confirmed → shipped (assign tracking #)
   - shipped → delivered
   - delivered → completed
7. System sends notification email/SMS to customer
8. Admin can add notes/comments
9. System logs the status change with timestamp
10. End Use Case

UC-29: ADD PRODUCT (Admin)
──────────────────────────
1. Admin navigates to Product Management
2. Admin clicks "Add New Product"
3. System displays product form with fields:
   - Name, description, price
   - Category, brand, stock
   - Image upload
   - Specifications (power, voltage, warranty, etc.)
4. Admin fills in all required fields
5. Admin uploads product image
6. Admin selects category and brand
7. Admin clicks submit
8. System validates all required fields
9. System generates product ID
10. System saves product to database
11. System confirms success message
12. Admin redirected to product list
13. End Use Case

```

