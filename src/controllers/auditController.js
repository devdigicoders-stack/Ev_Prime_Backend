const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs
// @route   GET /api/audit
// @access  Admin
const getAuditLogs = async (req, res) => {
  try {
    const { search, module, dateFilter, page = 1, limit = 10 } = req.query;

    let query = {};

    // Search filter (User, Action, or Details)
    if (search) {
      query.$or = [
        { user: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
      ];
    }

    // Module filter
    if (module && module !== 'All Modules') {
      query.module = module;
    }

    // Date filter
    if (dateFilter) {
      const now = new Date();
      let startDate = new Date();
      
      switch (dateFilter) {
        case 'Today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'This Week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'This Month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Check if limit is for export (e.g., limit=1000)
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Internal Helper for other controllers to use
const createAuditLog = async ({ user, role, action, module, details, ip }) => {
  try {
    await AuditLog.create({
      user,
      role,
      action,
      module,
      details,
      ip
    });
  } catch (error) {
    console.error('Failed to create audit log', error);
  }
};

module.exports = {
  getAuditLogs,
  createAuditLog
};
