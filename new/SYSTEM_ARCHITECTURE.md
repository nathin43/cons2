# Electric Shop E-Commerce System Architecture

## 1. UML CLASS DIAGRAM (Object-Oriented Design)

```
┌─────────────────────────────────────────────────────────────────┐
│                          SYSTEM OVERVIEW                          │
│                    Electric Shop E-Commerce                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                                  USER CLASS                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ Attributes:                                                                  │
│  - userId: ObjectId (Primary Key)                                          │
│  - name: String                                                            │
│  - email: String (Unique)                                                 │
│  - password: String (Hashed)                                              │
│  - phone: String                                                          │
│  - address: Address {                                                     │
│      street: String                                                       │
│      city: String                                                         │
│      state: String                                                        │
│      zipCode: String                                                      │
│      country: String                                                      │
│    }                                                                       │
│  - role: Enum ['customer']                                               │
│  - isEmailVerified: Boolean                                              │
│  - verificationCode: String                                              │
│  - lastLogin: Date                                                        │
│  - createdAt: Date                                                        │
│  - updatedAt: Date                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Methods:                                                                     │
│  + register(email, password, phone): Boolean                              │
│  + login(email, password): Token                                          │
│  + verifyEmail(code): Boolean                                             │
│  + updateProfile(data): User                                              │
│  + getOrders(): Order[]                                                   │
│  + getCart(): Cart                                                        │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │      CART        │  │     ORDER        │  │   WISHLIST       │
    ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
    │ - cartId         │  │ - orderId        │  │ - wishlistId     │
    │ - userId *       │  │ - userId *       │  │ - userId *       │
    │ - items[]        │  │ - items[]        │  │ - products[]     │
    │ - totalAmount    │  │ - orderDate      │  │ - createdAt      │
    │ - createdAt      │  │ - status         │  │ - updatedAt      │
    │ - updatedAt      │  │ - totalPrice     │  └──────────────────┘
    ├──────────────────┤  │ - shippingAddr   │
    │ + addItem()      │  │ - paymentMethod  │
    │ + removeItem()   │  │ - trackingNo     │
    │ + updateQty()    │  ├──────────────────┤
    │ + clearCart()    │  │ + createOrder()  │
    │ + checkout()     │  │ + updateStatus() │
    └──────────────────┘  │ + trackOrder()   │
                          └──────────────────┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │    PRODUCT *     │
                          ├──────────────────┤
                          │ - productId      │
                          │ - name           │
                          │ - price          │
                          │ - quantity       │
                          └──────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCT CLASS                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ Attributes:                                                                  │
│  - productId: ObjectId (Primary Key)                                       │
│  - name: String                                                            │
│  - description: String                                                     │
│  - price: Number                                                           │
│  - category: Enum [Wire & Cables, Fan, Pipes, Motors, Heater,           │
│                     Lights, Switches, Tank, Water Heater, Other]          │
│  - brand: String                                                           │
│  - image: String (URL)                                                     │
│  - stock: Number                                                           │
│  - specifications: {                                                       │
│      power: String                                                         │
│      voltage: String                                                       │
│      warranty: String                                                      │
│      color: String                                                         │
│      dimensions: String                                                    │
│    }                                                                       │
│  - ratings: {                                                              │
│      average: Number (0-5)                                                │
│      count: Number                                                         │
│    }                                                                       │
│  - createdAt: Date                                                         │
│  - updatedAt: Date                                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ Methods:                                                                     │
│  + create(data): Product                                                   │
│  + updateStock(quantity): Boolean                                          │
│  + addRating(rating): Number                                               │
│  + getAvailability(): Boolean                                              │
│  + searchByCategory(category): Product[]                                   │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌──────────────────────┐      ┌──────────────────────┐
        │ CART ITEM / ORDER    │      │   PRODUCT RATING     │
        │     ITEM             │      ├──────────────────────┤
        ├──────────────────────┤      │ - ratingId           │
        │ - productId *        │      │ - productId *        │
        │ - quantity           │      │ - userId *           │
        │ - price (snapshot)   │      │ - rating: 1-5        │
        │ - addedAt            │      │ - review: Text       │
        └──────────────────────┘      │ - createdAt          │
                                      └──────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                              ADMIN CLASS                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ Attributes:                                                                  │
│  - adminId: ObjectId (Primary Key)                                         │
│  - name: String                                                            │
│  - email: String (Unique)                                                 │
│  - password: String (Hashed)                                              │
│  - role: Enum ['admin', 'superadmin']                                    │
│  - permissions: {                                                          │
│      canManageProducts: Boolean                                           │
│      canManageOrders: Boolean                                             │
│      canManageCustomers: Boolean                                          │
│      canManageAdmins: Boolean                                             │
│      canViewReports: Boolean                                              │
│    }                                                                       │
│  - lastLogin: Date                                                         │
│  - createdAt: Date                                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ Methods:                                                                     │
│  + adminLogin(email, password): Token                                      │
│  + createProduct(data): Product                                            │
│  + editProduct(id, data): Product                                          │
│  + deleteProduct(id): Boolean                                              │
│  + viewOrders(filters): Order[]                                            │
│  + updateOrderStatus(orderId, status): Order                               │
│  + viewCustomers(): User[]                                                 │
│  + generateReports(): Report                                               │
│  + assignPermissions(adminId, perms): Admin                                │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                        PAYMENT & ORDER CLASS                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ORDER STATUS: pending → confirmed → shipped → delivered → completed       │
│ PAYMENT STATUS: pending → processing → completed → failed → refunded      │
│                                                                              │
│ Attributes:                                                                 │
│  - orderId: ObjectId                                                       │
│  - orderNumber: String (Unique)                                            │
│  - paymentMethod: Enum [COD, Card, UPI, NetBanking]                       │
│  - paymentStatus: Enum [pending, completed, failed]                       │
│  - transactionId: String                                                   │
│  - trackingNumber: String                                                  │
│  - estimatedDelivery: Date                                                 │
│  - discount: Number                                                        │
│  - tax: Number                                                             │
│  - totalPrice: Number                                                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                        RELATIONSHIPS & MULTIPLICITY                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User (1) ──────── (1..n) Cart                                             │
│           └─────── (1..n) Order                                            │
│           └─────── (1..n) Rating                                           │
│                                                                              │
│  Product (1) ───── (1..n) CartItem                                         │
│            └────── (1..n) OrderItem                                        │
│            └────── (1..n) Rating                                           │
│                                                                              │
│  Order (1) ─────── (1..n) OrderItem                                        │
│        └────────── (1) ShippingAddress                                     │
│        └────────── (1) Payment                                             │
│                                                                              │
│  Admin (1) ─────── (n) Products (managed)                                 │
│       └─────────── (n) Orders (managed)                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Key Class Relationships:

- **User**: Central entity representing customers
- **Product**: Catalog of electrical items
- **Cart**: Temporary shopping basket linked to User
- **Order**: Completed purchase transaction with multiple items
- **Admin**: System administrator with role-based permissions
- **Associations**: User has many Carts and Orders; Product appears in multiple Carts/Orders

