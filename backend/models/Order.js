const mongoose = require('mongoose');

/**
 * Order Schema for managing customer orders
 * Stores complete order information including items, shipping, and payment
 */
const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    image: String,
    category: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  shippingAddress: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash on Delivery', 'Credit Card', 'Debit Card', 'UPI', 'RAZORPAY']
  },
  // Razorpay-specific fields (only populated for RAZORPAY orders)
  razorpayOrderId: {
    type: String,
    default: null
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  razorpaySignature: {
    type: String,
    default: null
  },
  paymentDetails: {
    creditCard: {
      cardholderName: String,
      cardNumber: String, // Last 4 digits only
      expiryDate: String
    },
    debitCard: {
      cardholderName: String,
      cardNumber: String, // Last 4 digits only
      expiryDate: String
    },
    upi: {
      upiId: String,
      provider: {
        type: String,
        enum: ['gpay', 'phonepe', 'paytm', 'bhim'],
        default: 'gpay'
      }
    }
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  subtotal: {
    type: Number,
    default: 0
  },
  gst: {
    type: Number,
    default: 0
  },
  shipping: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  cancelled: {
    type: Boolean,
    default: false
  },
  cancelReason: {
    type: String,
    trim: true,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancelledBy: {
    type: String,
    enum: ['User', 'Admin', 'System'],
    default: null
  },
  deliveredAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD${Date.now()}${count + 1}`;
  }
  next();
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ cancelled: 1, cancelledAt: -1 });

// Additional indexes for dashboard aggregations
orderSchema.index({ orderStatus: 1, createdAt: -1 }); // For pending/shipped/delivered filters
orderSchema.index({ paymentStatus: 1, createdAt: -1 }); // For payment status + time filters
orderSchema.index({ $or: [{ orderStatus: 1 }, { paymentStatus: 1 }], createdAt: -1 }); // Compound for dashboard sales query

module.exports = mongoose.model('Order', orderSchema);
