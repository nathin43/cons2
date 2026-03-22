const mongoose = require('mongoose');
const Order = require('../models/Order');
const Report = require('../models/Report');
const User = require('../models/User');

const buildSummaryFromOrders = async (userId) => {
  const [summary] = await Order.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$user',
        totalOrders: { $sum: 1 },
        totalAmountSpent: {
          $sum: {
            $cond: [
              { $eq: ['$orderStatus', 'delivered'] },
              { $ifNull: ['$totalAmount', '$totalPrice'] },
              0
            ]
          }
        },
        lastOrderDate: { $max: '$createdAt' }
      }
    }
  ]);

  return {
    totalOrders: summary?.totalOrders || 0,
    totalAmountSpent: summary?.totalAmountSpent || 0,
    lastOrderDate: summary?.lastOrderDate || null
  };
};

const buildSummariesForUsers = async (userIds = []) => {
  const objectIds = userIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (!objectIds.length) {
    return new Map();
  }

  const summaries = await Order.aggregate([
    { $match: { user: { $in: objectIds } } },
    {
      $group: {
        _id: '$user',
        totalOrders: { $sum: 1 },
        totalAmountSpent: {
          $sum: {
            $cond: [
              { $eq: ['$orderStatus', 'delivered'] },
              { $ifNull: ['$totalAmount', '$totalPrice'] },
              0
            ]
          }
        },
        lastOrderDate: { $max: '$createdAt' }
      }
    }
  ]);

  const summaryMap = new Map();
  summaries.forEach((summary) => {
    summaryMap.set(summary._id.toString(), {
      totalOrders: summary.totalOrders || 0,
      totalAmountSpent: summary.totalAmountSpent || 0,
      lastOrderDate: summary.lastOrderDate || null
    });
  });

  return summaryMap;
};

const upsertUserReportSummary = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID for report summary');
  }

  const user = await User.findById(userId).select('name email');
  if (!user) {
    throw new Error('User not found for report summary');
  }

  const { totalOrders, totalAmountSpent, lastOrderDate } = await buildSummaryFromOrders(userId);
  const now = new Date();

  const update = {
    $set: {
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      reportType: 'User Summary',
      reportStatus: 'Generated',
      totalOrders,
      totalAmountSpent,
      lastOrderDate,
      generatedAt: now,
      reportGeneratedAt: now
    },
    $unset: {
      order: '',
      orderNumber: '',
      orderStatus: '',
      orderDate: '',
      items: '',
      totalAmount: '',
      paymentMethod: '',
      transactionId: '',
      paymentStatus: '',
      paymentDate: '',
      shippingAddress: '',
      notes: ''
    }
  };

  return Report.findOneAndUpdate(
    { user: user._id, reportType: 'User Summary' },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const syncUserReportSummaries = async (userIds = []) => {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueIds.length) return [];

  return Promise.all(
    uniqueIds.map(async (userId) => {
      try {
        return await upsertUserReportSummary(userId);
      } catch (error) {
        console.error(`Failed to sync report summary for user ${userId}:`, error.message);
        return null;
      }
    })
  );
};

const upsertUserReportSummariesBulk = async (users = []) => {
  const cleanedUsers = users.filter((user) => user && user._id);
  if (!cleanedUsers.length) return { matchedCount: 0, modifiedCount: 0 };

  const userIds = cleanedUsers.map((user) => user._id.toString());
  const summaryMap = await buildSummariesForUsers(userIds);
  const now = new Date();

  const operations = cleanedUsers.map((user) => {
    const summary = summaryMap.get(user._id.toString()) || {
      totalOrders: 0,
      totalAmountSpent: 0,
      lastOrderDate: null
    };

    return {
      updateOne: {
        filter: { user: user._id, reportType: 'User Summary' },
        update: {
          $set: {
            user: user._id,
            userName: user.name,
            userEmail: user.email,
            reportType: 'User Summary',
            reportStatus: 'Generated',
            totalOrders: summary.totalOrders,
            totalAmountSpent: summary.totalAmountSpent,
            lastOrderDate: summary.lastOrderDate,
            generatedAt: now,
            reportGeneratedAt: now
          },
          $unset: {
            order: '',
            orderNumber: '',
            orderStatus: '',
            orderDate: '',
            items: '',
            totalAmount: '',
            paymentMethod: '',
            transactionId: '',
            paymentStatus: '',
            paymentDate: '',
            shippingAddress: '',
            notes: ''
          }
        },
        upsert: true
      }
    };
  });

  try {
    return await Report.bulkWrite(operations, { ordered: false });
  } catch (error) {
    console.error('Bulk report summary sync failed:', error.message);
    throw error;
  }
};

module.exports = {
  upsertUserReportSummary,
  syncUserReportSummaries,
  upsertUserReportSummariesBulk
};
