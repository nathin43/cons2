const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema for Customer accounts
 * Stores customer information and authentication data
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number']
  },
  profileImage: {
    type: String,
    default: null
  },
  googleId: {
    type: String,
    default: null,
    sparse: true
  },
  loginType: {
    type: String,
    enum: ['email', 'google'],
    default: 'email'
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  role: {
    type: String,
    enum: ['customer'],
    default: 'customer'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'BLOCKED', 'SUSPENDED', 'INACTIVE'],
    default: 'ACTIVE'
  },
  statusReason: {
    type: String,
    default: null
  },
  statusChangedAt: {
    type: Date,
    default: Date.now
  },
  statusChangedBy: {
    type: String,
    default: null
  },
  suspensionUntil: {
    type: Date,
    default: null
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Check for duplicate googleId if it exists
  if (this.googleId) {
    const existingUser = await mongoose.model('User').findOne({
      googleId: this.googleId,
      _id: { $ne: this._id }
    });
    if (existingUser) {
      throw new Error('User with this Google ID already exists');
    }
  }

  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Determine actual status based on priority rules
userSchema.methods.getActualStatus = function() {
  // Priority 1: BLOCKED (manual override)
  if (this.status === 'BLOCKED') {
    return {
      status: 'BLOCKED',
      reason: this.statusReason || 'Account blocked by admin',
      changedAt: this.statusChangedAt,
      changedBy: this.statusChangedBy
    };
  }

  // Priority 2: SUSPENDED (temporary restriction)
  if (this.status === 'SUSPENDED') {
    // Check if suspension has expired
    if (this.suspensionUntil && new Date() > this.suspensionUntil) {
      return {
        status: 'ACTIVE',
        reason: 'Suspension period ended',
        changedAt: new Date(),
        changedBy: 'system'
      };
    }
    return {
      status: 'SUSPENDED',
      reason: this.statusReason || 'Account temporarily suspended',
      changedAt: this.statusChangedAt,
      changedBy: this.statusChangedBy,
      suspensionUntil: this.suspensionUntil
    };
  }

  // Priority 3: INACTIVE (auto-calculated based on last login)
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  
  if (this.lastLoginAt && this.lastLoginAt < sixtyDaysAgo) {
    return {
      status: 'INACTIVE',
      reason: 'No activity for 60+ days',
      changedAt: this.lastLoginAt,
      changedBy: 'system'
    };
  }

  // Default: ACTIVE
  return {
    status: 'ACTIVE',
    reason: null,
    changedAt: this.statusChangedAt,
    changedBy: this.statusChangedBy
  };
};

module.exports = mongoose.model('User', userSchema);
