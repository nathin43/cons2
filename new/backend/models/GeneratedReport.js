const mongoose = require('mongoose');

/**
 * Generated Report Schema
 * Stores snapshots of aggregated reports (Sales, Stock, Customer, Payment, Order)
 * Auto-saved when reports are generated/fetched
 */
const generatedReportSchema = new mongoose.Schema({
  // Report Identification
  type: {
    type: String,
    required: true,
    enum: ['sales', 'stock', 'customer', 'customers', 'payment', 'payments', 'order', 'orders']
  },
  
  // Report Summary Data
  summary: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Detailed Report Data
  data: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  
  // Additional Analytics
  analytics: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Filters Applied
  filters: {
    dateFrom: Date,
    dateTo: Date,
    status: String,
    category: String,
    search: String,
    minAmount: Number,
    maxAmount: Number,
    minOrders: Number,
    maxOrders: Number,
    other: mongoose.Schema.Types.Mixed
  },
  
  // Generation Metadata
  generatedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  
  // Report Statistics
  recordCount: {
    type: Number,
    default: 0
  },
  
  // Expiry (optional - for cleanup of old reports)
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'generated_reports'
});

// Indexes for efficient querying
generatedReportSchema.index({ type: 1, generatedAt: -1 });
generatedReportSchema.index({ type: 1, createdAt: -1 });
generatedReportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Methods
generatedReportSchema.methods.toJSON = function() {
  const obj = this.toObject();
  return {
    _id: obj._id,
    type: obj.type,
    summary: obj.summary,
    data: obj.data,
    analytics: obj.analytics,
    filters: obj.filters,
    generatedAt: obj.generatedAt,
    recordCount: obj.recordCount
  };
};

// Static method to save a new report
generatedReportSchema.statics.saveReport = async function(reportType, summary, data, filters = {}, adminId = null) {
  try {
    // Set expiry to 30 days from now (optional - remove if you want to keep all reports)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    const report = await this.create({
      type: reportType,
      summary: summary || {},
      data: data || [],
      filters: filters,
      generatedBy: adminId,
      recordCount: Array.isArray(data) ? data.length : 0,
      expiresAt: expiresAt
    });
    
    console.log(`✅ Report saved to database: ${reportType} (${report.recordCount} records)`);
    return report;
  } catch (error) {
    console.error(`❌ Failed to save report ${reportType}:`, error.message);
    throw error;
  }
};

// Static method to get latest report of a type
generatedReportSchema.statics.getLatest = async function(reportType, filters = {}) {
  try {
    const query = { type: reportType };
    
    // Match filters if provided
    if (Object.keys(filters).length > 0) {
      query.filters = filters;
    }
    
    const report = await this.findOne(query)
      .sort({ generatedAt: -1 })
      .lean();
    
    return report;
  } catch (error) {
    console.error(`❌ Failed to fetch latest report ${reportType}:`, error.message);
    return null;
  }
};

// Static method to get report history
generatedReportSchema.statics.getHistory = async function(reportType, limit = 10) {
  try {
    const reports = await this.find({ type: reportType })
      .select('type summary generatedAt recordCount filters')
      .sort({ generatedAt: -1 })
      .limit(limit)
      .lean();
    
    return reports;
  } catch (error) {
    console.error(`❌ Failed to fetch report history ${reportType}:`, error.message);
    return [];
  }
};

// Static method to clean up old reports
generatedReportSchema.statics.cleanupOldReports = async function(daysOld = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await this.deleteMany({
      generatedAt: { $lt: cutoffDate }
    });
    
    console.log(`🧹 Cleaned up ${result.deletedCount} old reports (older than ${daysOld} days)`);
    return result.deletedCount;
  } catch (error) {
    console.error('❌ Failed to cleanup old reports:', error.message);
    return 0;
  }
};

module.exports = mongoose.model('GeneratedReport', generatedReportSchema);
