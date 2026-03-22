const ActivityLog = require('../models/ActivityLog');

/**
 * Log an admin action (called internally by other controllers)
 */
exports.logActivity = async ({ admin, action, targetType, targetId, details, ipAddress }) => {
  try {
    await ActivityLog.create({ admin, action, targetType, targetId, details, ipAddress });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};

/**
 * Get activity logs with filters
 * @route GET /api/activity-logs
 */
exports.getActivityLogs = async (req, res) => {
  try {
    const { action, targetType, adminId, fromDate, toDate, page, limit } = req.query;
    const query = {};

    if (action) query.action = action;
    if (targetType) query.targetType = targetType;
    if (adminId) query.admin = adminId;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const pageNum = parseInt(page) || 1;
    const perPage = parseInt(limit) || 50;
    const skip = (pageNum - 1) * perPage;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('admin', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(perPage),
      ActivityLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / perPage),
      logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a single activity log by ID
 * @route GET /api/activity-logs/:id
 */
exports.getActivityLogById = async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id).populate('admin', 'name email');
    if (!log) {
      return res.status(404).json({ success: false, message: 'Activity log not found' });
    }
    res.status(200).json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get activity stats summary
 * @route GET /api/activity-logs/stats
 */
exports.getActivityStats = async (req, res) => {
  try {
    const { days } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - (parseInt(days) || 30));

    const [byAction, byAdmin, total] = await Promise.all([
      ActivityLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ActivityLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$admin', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'admins',
            localField: '_id',
            foreignField: '_id',
            as: 'adminInfo',
          },
        },
        {
          $project: {
            count: 1,
            adminName: { $arrayElemAt: ['$adminInfo.name', 0] },
            adminEmail: { $arrayElemAt: ['$adminInfo.email', 0] },
          },
        },
      ]),
      ActivityLog.countDocuments({ createdAt: { $gte: since } }),
    ]);

    res.status(200).json({ success: true, period: `${parseInt(days) || 30} days`, total, byAction, byAdmin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete old activity logs
 * @route DELETE /api/activity-logs/cleanup
 */
exports.cleanupLogs = async (req, res) => {
  try {
    const { olderThanDays } = req.query;
    const daysToKeep = parseInt(olderThanDays) || 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);

    const result = await ActivityLog.deleteMany({ createdAt: { $lt: cutoff } });
    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} logs older than ${daysToKeep} days`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
