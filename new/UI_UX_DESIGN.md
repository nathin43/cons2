# USER INTERFACE & USER EXPERIENCE DESIGN

## Electric Shop E-Commerce System

```
═══════════════════════════════════════════════════════════════════════════════════
                    UI/UX DESIGN DOCUMENT (v1.0)
           Electric Shop E-Commerce System - Interface Architecture
═══════════════════════════════════════════════════════════════════════════════════

                              TABLE OF CONTENTS
─────────────────────────────────────────────────────────────────────────────────
1. Design System Overview
2. Customer Interface Flow
3. Admin Dashboard Design
4. Component Architecture
5. Wireframes & Layouts
6. Responsive Design Strategy
7. Navigation Hierarchy
8. Color Scheme & Typography
9. User Experience Guidelines
10. Accessibility Standards


═══════════════════════════════════════════════════════════════════════════════════
                        1. DESIGN SYSTEM OVERVIEW
═══════════════════════════════════════════════════════════════════════════════════

DESIGN PRINCIPLES:
──────────────────
✓ Simplicity: Clean, uncluttered interface
✓ Consistency: Uniform design across all pages
✓ Feedback: Clear system responses to user actions
✓ Accessibility: WCAG 2.1 AA compliance
✓ Performance: Fast loading and smooth interactions
✓ Mobile-First: Design optimized for mobile devices
✓ User-Centric: Focus on customer needs and pain points


COLOR PALETTE:
───────────────
Primary Colors:
├─ Primary Blue: #007BFF (Main actions, links, buttons)
├─ Secondary Green: #28A745 (Success, confirmations, positive actions)
├─ Danger Red: #DC3545 (Errors, cancellations, warnings)
└─ Dark Gray: #343A40 (Text, headings)

Neutral Colors:
├─ Light Gray: #F8F9FA (Backgrounds, separators)
├─ Border Gray: #DEE2E6 (Input borders, dividers)
└─ Text Black: #212529 (Body text)

Semantic Colors:
├─ Success: #28A745 (Confirmations, successful operations)
├─ Warning: #FFC107 (Alerts, cautions)
├─ Info: #17A2B8 (Information messages)
└─ Error: #DC3545 (Errors, failures)


TYPOGRAPHY:
─────────────
Font Family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif

Size Scale:
├─ H1: 32px (Page titles)
├─ H2: 28px (Section headings)
├─ H3: 24px (Subsection headings)
├─ H4: 20px (Card titles)
├─ Body: 16px (Regular text)
├─ Small: 14px (Secondary text)
└─ Micro: 12px (Helper text, labels)

Font Weights:
├─ Bold: 700 (Headings, important text)
├─ Semibold: 600 (Emphasis, buttons)
├─ Regular: 400 (Body text)
└─ Light: 300 (Secondary information)


SPACING SYSTEM:
─────────────────
Base Unit: 8px

Spacing Scale:
├─ 4px (xs) - Tight spacing
├─ 8px (sm) - Small spacing
├─ 16px (md) - Default spacing
├─ 24px (lg) - Large spacing
├─ 32px (xl) - Extra large spacing
└─ 48px (2xl) - Page margin spacing


BORDER RADIUS:
───────────────
├─ 4px - Input fields, buttons
├─ 8px - Cards, modals
└─ 50% - Avatar, circular elements


SHADOWS:
─────────
├─ Elevation 1: 0 2px 4px rgba(0,0,0,0.1)
├─ Elevation 2: 0 4px 8px rgba(0,0,0,0.15)
└─ Elevation 3: 0 8px 16px rgba(0,0,0,0.2)


═══════════════════════════════════════════════════════════════════════════════════
                      2. CUSTOMER INTERFACE FLOW
═══════════════════════════════════════════════════════════════════════════════════

MAIN PAGE LAYOUTS:

┌──────────────────────────────────────────────────────────────────────┐
│                         NAVIGATION BAR                               │
│  [Logo] [Search] [Home] [Categories] [Account] [Cart] [Wishlist]    │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  HERO SECTION (Homepage)                                            │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                                                                │ │
│  │  [Large Banner Image - Electric Products]                    │ │
│  │  "Shop Premium Electrical Supplies"                          │ │
│  │  [Shop Now Button] [Explore Categories]                     │ │
│  │                                                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  FEATURED PRODUCTS SECTION                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                     │
│  │      │ │      │ │      │ │      │ │      │                     │
│  │ Img  │ │ Img  │ │ Img  │ │ Img  │ │ Img  │  (Scrollable)      │
│  │      │ │      │ │      │ │      │ │      │                     │
│  ├──────┤ ├──────┤ ├──────┤ ├──────┤ ├──────┤                     │
│  │Name  │ │Name  │ │Name  │ │Name  │ │Name  │                     │
│  │Price │ │Price │ │Price │ │Price │ │Price │                     │
│  │⭐4.5 │ │⭐4.2 │ │⭐4.8 │ │⭐4.0 │ │⭐4.9 │                     │
│  │[Add] │ │[Add] │ │[Add] │ │[Add] │ │[Add] │                     │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                     CATEGORY CARDS SECTION                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │ Wire &      │ │   Fan       │ │   Pipes     │ │  Motors     │  │
│  │ Cables      │ │             │ │             │ │             │  │
│  │   [>>]      │ │   [>>]      │ │   [>>]      │ │   [>>]      │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │
│                                                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │ Heater      │ │   Lights    │ │  Switches   │ │   Tank      │  │
│  │             │ │             │ │             │ │             │  │
│  │   [>>]      │ │   [>>]      │ │   [>>]      │ │   [>>]      │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                         FOOTER                                        │
│  About | Contact | Shipping Info | Return Policy | Privacy | Terms  │
│  Follow: [Facebook] [Twitter] [Instagram] [LinkedIn]                │
└──────────────────────────────────────────────────────────────────────┘


PRODUCTS LISTING PAGE:

┌──────────────────────────────────────────────────────────────────────┐
│ [Back] Products > Wire & Cables                    [Sort ▼] [View ▼] │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────┐ ┌────────────────────────────────────────────────────┐
│   FILTERS    │ │                   PRODUCT GRID                     │
│              │ │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│ Price        │ │ │      │ │      │ │      │ │      │              │
│ [₹100-500]   │ │ │ Img  │ │ Img  │ │ Img  │ │ Img  │              │
│ [₹500-1000]  │ │ │      │ │      │ │      │ │      │              │
│ [₹1000+]     │ │ ├──────┤ ├──────┤ ├──────┤ ├──────┤              │
│              │ │ │Name  │ │Name  │ │Name  │ │Name  │              │
│ Brand        │ │ │Price │ │Price │ │Price │ │Price │              │
│ ☑ Brand A    │ │ │⭐4.5 │ │⭐4.2 │ │⭐4.8 │ │⭐4.0 │              │
│ ☑ Brand B    │ │ │[Add] │ │[Add] │ │[Add] │ │[Add] │              │
│ ☑ Brand C    │ │ └──────┘ └──────┘ └──────┘ └──────┘              │
│              │ │                                                    │
│ Rating       │ │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│ ☑ ⭐⭐⭐⭐⭐  │ │ │      │ │      │ │      │ │      │              │
│ ☑ ⭐⭐⭐⭐   │ │ │ Img  │ │ Img  │ │ Img  │ │ Img  │              │
│ ☑ ⭐⭐⭐    │ │ │      │ │      │ │      │ │      │              │
│              │ │ ├──────┤ ├──────┤ ├──────┤ ├──────┤              │
│ [Apply]      │ │ │Name  │ │Name  │ │Name  │ │Name  │              │
│ [Reset]      │ │ │Price │ │Price │ │Price │ │Price │              │
│              │ │ │⭐4.5 │ │⭐4.2 │ │⭐4.8 │ │⭐4.0 │              │
│              │ │ │[Add] │ │[Add] │ │[Add] │ │[Add] │              │
│              │ │ └──────┘ └──────┘ └──────┘ └──────┘              │
│              │ │                                                    │
│              │ │ [1] [2] [3] [4] [Next >]  Showing 1-12 of 156   │
│              │ │                                                    │
└──────────────┘ └────────────────────────────────────────────────────┘


PRODUCT DETAILS PAGE:

┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌──────────────┐ ┌──────────────────────────────────────────────┐ │
│  │              │ │ Wire & Cables > 2.5mm Copper Wire           │ │
│  │   [    ]     │ │                                              │ │
│  │   [    ]     │ │ ⭐⭐⭐⭐⭐ (248 Reviews)                    │ │
│  │   [Large]    │ │                                              │ │
│  │   [    ]     │ │ ₹450/meter  [In Stock: 156 units]           │ │
│  │   [    ]     │ │                                              │ │
│  │              │ │ Description:                                 │ │
│  │   < >        │ │ High-quality 2.5mm copper wire suitable for │ │
│  │              │ │ residential and light commercial wiring...   │ │
│  │ Thumbnails   │ │                                              │ │
│  │ [Img][Img]   │ │ Specifications:                              │ │
│  │ [Img][Img]   │ │ • Voltage: 220V                             │ │
│  │              │ │ • Conductor: Copper                         │ │
│  │              │ │ • Insulation: PVC                           │ │
│  │              │ │ • Length: Per Meter                         │ │
│  │              │ │ • Warranty: 1 Year                          │ │
│  │              │ │                                              │ │
│  │              │ │ Quantity: [1] [+] [-]                      │ │
│  │              │ │                                              │ │
│  │              │ │ [ADD TO CART] [ADD TO WISHLIST] [SHARE]    │ │
│  │              │ │                                              │ │
│  └──────────────┘ └──────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      CUSTOMER REVIEWS                          │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │ ⭐⭐⭐⭐⭐ John Doe                          2 days ago │ │ │
│  │  │ "Excellent product! Very durable and good quality."     │ │ │
│  │  │ Verified Purchase                                        │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │ ⭐⭐⭐⭐ Jane Smith                        5 days ago  │ │ │
│  │  │ "Good quality. Fast delivery. Recommended."             │ │ │
│  │  │ Verified Purchase                                        │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │  [Load More Reviews] [Write Review]                          │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │               RELATED PRODUCTS                                 │ │
│  │  [Product] [Product] [Product] [Product] [Product]            │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘


SHOPPING CART PAGE:

┌──────────────────────────────────────────────────────────────────────┐
│ Shopping Cart                                    [Continue Shopping]  │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐ ┌──────────────────────────────┐
│                                  │ │  ORDER SUMMARY               │
│ ┌──────────────────────────────┐ │ ├──────────────────────────────┤
│ │ [Img] Product Name 1        │ │ │ Subtotal:        ₹2,000     │
│ │ ₹450 x 2 = ₹900             │ │ │ Shipping:        ₹100       │
│ │ Qty: [1] [+] [-] [Remove]   │ │ │ Tax (18%):       ₹378       │
│ └──────────────────────────────┘ │ ├──────────────────────────────┤
│                                  │ │ TOTAL:           ₹2,478     │
│ ┌──────────────────────────────┐ │ │                              │
│ │ [Img] Product Name 2        │ │ │ [Proceed to Checkout]       │
│ │ ₹1,200 x 1 = ₹1,200         │ │ │                              │
│ │ Qty: [1] [+] [-] [Remove]   │ │ ├──────────────────────────────┤
│ └──────────────────────────────┘ │ │ Apply Coupon:               │
│                                  │ │ [Code: ________] [Apply]    │
│ ┌──────────────────────────────┐ │ │                              │
│ │ [Img] Product Name 3        │ │ │ Save for Later:             │
│ │ ₹800 x 3 = ₹2,400           │ │ │ [View Wishlist]             │
│ │ Qty: [1] [+] [-] [Remove]   │ │ │                              │
│ └──────────────────────────────┘ │ │                              │
│                                  │ │                              │
│ [Continue Shopping] [Clear Cart] │ │                              │
│                                  │ │                              │
└──────────────────────────────────┘ └──────────────────────────────┘


CHECKOUT PAGE:

┌──────────────────────────────────────────────────────────────────────┐
│ Checkout                    [Step 1: Shipping] [Step 2: Payment]     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ SHIPPING ADDRESS                                                    │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │                                                                │ │
│ │ Full Name:      [_______________________________]             │ │
│ │ Email:          [_______________________________]             │ │
│ │ Phone:          [_______________________________]             │ │
│ │                                                                │ │
│ │ Street Address: [_______________________________]             │ │
│ │ City:           [_________________]  State:  [_____]         │ │
│ │ Zip Code:       [_________________]  Country:[_____]         │ │
│ │                                                                │ │
│ │ ☐ Same as billing address                                     │ │
│ │                                                                │ │
│ │ [Previous Address 1] [Previous Address 2]                    │ │
│ │                                                                │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ SHIPPING METHOD                                                     │
│ ◉ Standard Delivery (₹100) - 5-7 business days                    │ │
│ ○ Express Delivery (₹300) - 2-3 business days                     │ │
│ ○ Overnight Delivery (₹500) - Next day                            │ │
│                                                                      │
│                                                                      │
│ [Back] [Next: Payment >]                                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

Step 2: Payment Page

┌──────────────────────────────────────────────────────────────────────┐
│ Payment Method                                                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ◉ Credit / Debit Card                                              │ │
│   ┌────────────────────────────────────────────────────────────┐  │ │
│   │ Card Number: [____-____-____-____]                         │  │ │
│   │ Name:        [_____________________]                       │  │ │
│   │ Expiry:      [MM/YY] CVV: [___]                           │  │ │
│   └────────────────────────────────────────────────────────────┘  │ │
│                                                                      │ │
│ ○ UPI / Mobile Wallet                                             │ │
│   [Google Pay] [Paytm] [PhonePe]                                  │ │
│                                                                      │ │
│ ○ Net Banking                                                      │ │
│   [Bank Selection Dropdown]                                         │ │
│                                                                      │ │
│ ○ Cash on Delivery (COD)                                          │ │
│                                                                      │
│                                                                      │
│ BILLING ADDRESS                                                     │
│ ☐ Same as shipping address                                        │ │
│                                                                      │
│ ORDER SUMMARY                                                       │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ Products:              ₹4,500                                 │ │
│ │ Shipping:              ₹100                                   │ │
│ │ Tax:                   ₹810                                   │ │
│ │ Discount:              -₹200                                  │ │
│ │ ────────────────────────────────────────────                 │ │
│ │ TOTAL:                 ₹5,210                                 │ │
│ │ ────────────────────────────────────────────                 │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ [< Back] [Confirm & Pay]                                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘


ORDER CONFIRMATION PAGE:

┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                   ✓ ORDER CONFIRMED                                │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Order Number: #ORD-2024-00547                               │  │
│  │ Order Date: Dec 31, 2024                                    │  │
│  │ Expected Delivery: Jan 5, 2025                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Confirmation email sent to: john@example.com                      │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ORDERED ITEMS                                               │  │
│  │ • 2.5mm Copper Wire (2 meters) - ₹900                      │  │
│  │ • Circuit Breaker (20A) - ₹1,200                           │  │
│  │ • Plastic Pipes (2 inch) (3 pieces) - ₹2,400               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ WHAT'S NEXT?                                               │  │
│  │ 1. You will receive shipping updates via email & SMS        │  │
│  │ 2. Track your order [Track Order Button]                  │  │
│  │ 3. Estimated delivery: Jan 5, 2025                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  [Continue Shopping] [Go to Orders] [Print Invoice]               │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════
                    3. ADMIN DASHBOARD DESIGN
═══════════════════════════════════════════════════════════════════════════════════

ADMIN DASHBOARD LAYOUT:

┌──────────────────────────────────────────────────────────────────────┐
│ Admin Panel                          [Admin Profile] [Settings] [Logout]
└──────────────────────────────────────────────────────────────────────┘

┌─────────────┐ ┌────────────────────────────────────────────────────┐
│  SIDEBAR    │ │                   DASHBOARD                        │
│             │ │                                                    │
│ Dashboard   │ │ Welcome back, Admin!                               │
│ Products    │ │                                                    │
│ Orders      │ │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ Customers   │ │ │Orders   │ │Products │ │Revenue  │ │Users    │ │
│ Reports     │ │ │125      │ │1,240    │ │₹2.5L    │ │850      │ │
│ Settings    │ │ │↑15%     │ │↓8%      │ │↑22%     │ │↑12%     │ │
│             │ │ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
│ [Logout]    │ │                                                    │
│             │ │ RECENT ORDERS                                     │
│             │ │ ┌─────────────────────────────────────────────┐   │
│             │ │ │ Order# │ Customer │ Items │ Total │ Status  │   │
│             │ │ │─────────────────────────────────────────────│   │
│             │ │ │ #00547 │ John Doe │   3   │₹5,210 │ Shipped │   │
│             │ │ │ #00546 │ Jane S.  │   2   │₹3,400 │ Pending │   │
│             │ │ │ #00545 │ Mike J.  │   1   │₹1,200 │ Delivered   │
│             │ │ │ #00544 │ Sarah M. │   4   │₹6,800 │ Confirmed   │
│             │ │ └─────────────────────────────────────────────┘   │
│             │ │                [View All]                        │ │
│             │ │                                                    │
│             │ │ SALES CHART (Last 30 Days)                       │ │
│             │ │ ┌─────────────────────────────────────────────┐   │
│             │ │ │  Bar Chart / Line Graph                    │   │
│             │ │ │  Peak: Dec 25 (₹4.2L)                     │   │
│             │ │ │  Average: ₹2.8L/day                       │   │
│             │ │ └─────────────────────────────────────────────┘   │
│             │ │                                                    │
└─────────────┘ └────────────────────────────────────────────────────┘


PRODUCTS MANAGEMENT PAGE:

┌─────────────┐ ┌────────────────────────────────────────────────────┐
│  SIDEBAR    │ │ Products Management                [+ Add Product] │
│             │ ├────────────────────────────────────────────────────┤
│ Dashboard   │ │                                                    │
│ Products ✓  │ │ Search: [___________] Filter: [Category ▼] [Sort ▼]
│ Orders      │ │                                                    │
│ Customers   │ │ ┌─────────────────────────────────────────────┐   │
│ Reports     │ │ │ ID  │ Name    │ Category  │ Price │ Stock │   │
│ Settings    │ │ │─────────────────────────────────────────────│   │
│             │ │ │ 001 │ Wire    │ Wire &    │ ₹450  │ 156   │   │
│             │ │ │     │ 2.5mm   │ Cables    │       │       │   │
│             │ │ │─────────────────────────────────────────────│   │
│             │ │ │ 002 │ Breaker │ Switches  │ ₹1200 │ 45    │   │
│             │ │ │     │ 20A     │           │       │       │   │
│             │ │ │─────────────────────────────────────────────│   │
│             │ │ │ 003 │ Fan     │ Fan       │ ₹2500 │ 78    │   │
│             │ │ │     │ 3-Blade │           │       │       │   │
│             │ │ │─────────────────────────────────────────────│   │
│             │ │ │[Edit] [View] [Delete]                      │   │
│             │ │ │                                              │   │
│             │ │ │ Showing 1-10 of 1,240                      │   │
│             │ │ │ [< Prev] [1] [2] [3] [Next >]            │   │
│             │ │ └─────────────────────────────────────────────┘   │
│             │ │                                                    │
└─────────────┘ └────────────────────────────────────────────────────┘


ORDERS MANAGEMENT PAGE:

┌─────────────┐ ┌────────────────────────────────────────────────────┐
│  SIDEBAR    │ │ Orders Management                                  │
│             │ ├────────────────────────────────────────────────────┤
│ Dashboard   │ │ Filter: [Status ▼] [Date ▼] Search: [_________]   │
│ Products    │ │                                                    │
│ Orders ✓    │ │ ┌─────────────────────────────────────────────┐   │
│ Customers   │ │ │ Order# │ Customer │ Date  │ Status │ Total │   │
│ Reports     │ │ │─────────────────────────────────────────────│   │
│ Settings    │ │ │ #00547 │ John Doe │ 12/31 │ Shipped │ ₹5210 │  │
│             │ │ │ #00546 │ Jane S.  │ 12/30 │ Pending │ ₹3400 │  │
│             │ │ │ #00545 │ Mike J.  │ 12/29 │ Delivered │ ₹1200 │
│             │ │ │ #00544 │ Sarah M. │ 12/28 │ Confirmed │ ₹6800 │
│             │ │ │─────────────────────────────────────────────│   │
│             │ │ │[View Details] [Update Status] [Cancel]      │   │
│             │ │ │                                              │   │
│             │ │ │ Showing 1-20 of 125                        │   │
│             │ │ │ [< Prev] [1] [2] [3] [Next >]            │   │
│             │ │ └─────────────────────────────────────────────┘   │
│             │ │                                                    │
│             │ │ STATUS FILTER TABS:                              │
│             │ │ [All] [Pending] [Confirmed] [Shipped] [Delivered]
│             │ │                                                    │
└─────────────┘ └────────────────────────────────────────────────────┘


ORDER DETAILS VIEW:

┌──────────────────────────────────────────────────────────────────────┐
│ Order #00547                                     [< Back] [Print]    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ STATUS: Shipped [Change Status ▼]                                 │
│                                                                      │
│ CUSTOMER INFORMATION              │ SHIPPING INFORMATION            │
│ Name: John Doe                    │ Name: John Doe                  │
│ Email: john@example.com           │ Address: 123 Main St            │
│ Phone: 9876543210                 │ City: Mumbai, MH 400001         │
│                                   │ Country: India                  │
│ ORDERED ITEMS                     │ TRACKING INFO                   │
│ • Wire 2.5mm (2m) - ₹900         │ Tracking#: TRK-2024-547        │
│ • Breaker 20A (1) - ₹1,200       │ Carrier: FedEx                  │
│ • Pipes 2" (3) - ₹2,400          │ Expected: Jan 5, 2025           │
│                                   │                                 │
│ PAYMENT INFORMATION                                                  │
│ Method: Credit Card (Visa xxxx1234)                                │
│ Status: Completed                                                    │
│ Transaction ID: TXN-2024-00547                                     │
│                                                                      │
│ TOTALS                                                               │
│ Subtotal:           ₹4,500                                          │
│ Shipping:           ₹100                                            │
│ Tax (18%):          ₹810                                            │
│ Discount:           -₹200                                           │
│ ────────────────────────────────────────                          │
│ TOTAL:              ₹5,210                                          │
│                                                                      │
│ ACTIONS:                                                             │
│ [Update Status] [Send Email] [Print Invoice] [Generate Return Label]
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════
                    4. COMPONENT ARCHITECTURE
═══════════════════════════════════════════════════════════════════════════════════

REUSABLE COMPONENTS:

1. NAVIGATION & HEADER
   ├─ Navbar (Top navigation with logo, search, menu)
   ├─ Breadcrumb (Navigation path)
   └─ Sidebar (Admin sidebar navigation)

2. BUTTONS & FORMS
   ├─ Button (Primary, Secondary, Danger, Disabled states)
   ├─ Input Field (Text, Email, Password, Number)
   ├─ Dropdown/Select
   ├─ Checkbox
   ├─ Radio Button
   ├─ Toggle Switch
   └─ DatePicker

3. CARDS & CONTAINERS
   ├─ Product Card (Image, name, price, rating, actions)
   ├─ Order Card
   ├─ User Card
   ├─ Stats Card (Dashboard metrics)
   └─ Modal/Dialog

4. DATA DISPLAY
   ├─ Table (Sortable, filterable, paginated)
   ├─ List (Vertical list items)
   ├─ Grid (Product grid)
   ├─ Carousel (Image/product slider)
   └─ Chart (Bar, Line, Pie)

5. FEEDBACK & STATUS
   ├─ Toast Notification (Success, Error, Warning, Info)
   ├─ Alert Banner
   ├─ Spinner/Loading
   ├─ Badge (Status, category)
   └─ Progress Bar

6. COMMERCE COMPONENTS
   ├─ Product Gallery (Image with thumbnails)
   ├─ Rating Stars
   ├─ Price Display (With discount)
   ├─ Stock Status
   ├─ Quantity Selector
   └─ Cart Summary

7. AUTH COMPONENTS
   ├─ Login Form
   ├─ Register Form
   ├─ Password Reset Form
   └─ OTP Verification

8. FOOTER
   └─ Footer (Links, social media, company info)


═══════════════════════════════════════════════════════════════════════════════════
                    5. RESPONSIVE DESIGN STRATEGY
═══════════════════════════════════════════════════════════════════════════════════

BREAKPOINTS:

├─ Mobile (XS): 320px - 575px
├─ Tablet (SM): 576px - 767px
├─ Tablet (MD): 768px - 991px
├─ Desktop (LG): 992px - 1199px
└─ Desktop (XL): 1200px+

RESPONSIVE BEHAVIORS:

Homepage:
├─ XS: Single column layout, stacked cards
├─ SM: 2-column product grid
├─ MD: 3-column product grid
├─ LG: 4-column product grid
└─ XL: 5-column product grid

Product Grid:
├─ XS: 1 column, full-width cards
├─ SM: 2 columns
├─ MD: 3 columns
└─ LG+: 4 columns

Sidebar (Admin):
├─ XS/SM: Hidden, toggle with hamburger icon
├─ MD+: Always visible

Navigation:
├─ XS/SM: Hamburger menu (mobile navigation)
├─ MD+: Horizontal menu bar

Tables:
├─ XS/SM: Horizontal scroll or card view
├─ MD+: Full table view


═══════════════════════════════════════════════════════════════════════════════════
                    6. NAVIGATION HIERARCHY
═══════════════════════════════════════════════════════════════════════════════════

PRIMARY NAVIGATION (Main Menu):
├─ Home
├─ Categories
│  ├─ Wire & Cables
│  ├─ Fans
│  ├─ Pipes
│  ├─ Motors
│  ├─ Heaters
│  ├─ Lights
│  ├─ Switches
│  ├─ Tanks
│  └─ Water Heaters
├─ Search
├─ Cart
├─ Account
│  ├─ Profile
│  ├─ My Orders
│  ├─ Wishlist
│  ├─ Settings
│  └─ Logout

ADMIN NAVIGATION:
├─ Dashboard
├─ Products
│  ├─ All Products
│  ├─ Add Product
│  └─ Categories
├─ Orders
│  ├─ All Orders
│  ├─ Pending
│  ├─ Confirmed
│  ├─ Shipped
│  └─ Delivered
├─ Customers
│  ├─ All Customers
│  └─ Blocked Users
├─ Reports
│  ├─ Sales Report
│  ├─ Inventory Report
│  └─ Customer Analytics
├─ Settings
│  ├─ General
│  ├─ Email Configuration
│  ├─ Payment Gateway
│  └─ Admin Users

FOOTER LINKS:
├─ Company
│  ├─ About Us
│  ├─ Contact Us
│  └─ Careers
├─ Customer Service
│  ├─ FAQ
│  ├─ Shipping Info
│  ├─ Returns & Refunds
│  └─ Track Order
├─ Policies
│  ├─ Privacy Policy
│  ├─ Terms & Conditions
│  ├─ Cancellation Policy
│  └─ Warranty Policy
└─ Social Media
   ├─ Facebook
   ├─ Twitter
   ├─ Instagram
   └─ LinkedIn


═══════════════════════════════════════════════════════════════════════════════════
                    7. USER EXPERIENCE GUIDELINES
═══════════════════════════════════════════════════════════════════════════════════

INTERACTION PATTERNS:

1. FEEDBACK
   ✓ Show success message when item added to cart
   ✓ Display error messages in red with icon
   ✓ Toast notifications for async actions
   ✓ Loading spinners for data fetching
   ✓ Confirmation dialogs for destructive actions

2. FORM VALIDATION
   ✓ Real-time validation with visual feedback
   ✓ Clear error messages below invalid fields
   ✓ Disabled submit button until all required fields filled
   ✓ Success checkmark on valid fields
   ✓ Helper text for format requirements

3. LOADING STATES
   ✓ Skeleton screens for product lists
   ✓ Spinners for button actions
   ✓ Progress bars for file uploads
   ✓ "Estimating..." text during calculations

4. EMPTY STATES
   ✓ Friendly message when cart is empty
   ✓ Suggestion to continue shopping
   ✓ Illustration for visual interest
   ✓ Clear call-to-action button

5. ERROR HANDLING
   ✓ Clear error messages in plain language
   ✓ Suggest solutions when possible
   ✓ Provide contact support link
   ✓ Log errors for debugging
   ✓ Retry button for failed operations

6. PERFORMANCE
   ✓ Fast page loads (target: < 3 seconds)
   ✓ Lazy load images
   ✓ Infinite scroll or pagination
   ✓ Cached data for quick navigation
   ✓ Optimized images (WebP with fallback)

7. ACCESSIBILITY
   ✓ WCAG 2.1 AA compliance
   ✓ Keyboard navigation
   ✓ Screen reader support
   ✓ Color contrast ratio ≥ 4.5:1 for text
   ✓ Alt text for all images
   ✓ ARIA labels for interactive elements
   ✓ Focus indicators visible on all interactive elements
   ✓ Form labels associated with inputs


═══════════════════════════════════════════════════════════════════════════════════

Key Metrics for UI/UX Success:
├─ Page Load Time: < 3 seconds
├─ First Contentful Paint: < 1.5 seconds
├─ Largest Contentful Paint: < 2.5 seconds
├─ Cumulative Layout Shift: < 0.1
├─ Mobile Usability: 100/100 (Google Mobile-Friendly)
├─ Accessibility Score: ≥ 90/100
├─ User Satisfaction: ≥ 4.5/5 stars
└─ Cart Abandonment Rate: < 70%

```

