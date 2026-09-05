const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs
// @route   GET /api/audit
// @access  Admin
const getAuditLogs = async (req, res) => {
  try {
    const { search, module, dateFilter, startDate, endDate, page = 1, limit = 10 } = req.query;

    let query = {};

    // No filtering based on subadmin

    // Search filter across User, Role, Action, Module, Details, and IP Address
    if (search && search.trim()) {
      const s = search.trim();
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { user: { $regex: s, $options: 'i' } },
          { role: { $regex: s, $options: 'i' } },
          { action: { $regex: s, $options: 'i' } },
          { module: { $regex: s, $options: 'i' } },
          { details: { $regex: s, $options: 'i' } },
          { ip: { $regex: s, $options: 'i' } },
        ]
      });
    }

    // Module filter (case-insensitive exact match)
    if (module && module !== 'All Modules') {
      query.module = { $regex: new RegExp(`^${module.trim()}$`, 'i') };
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        query.createdAt.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        query.createdAt.$lte = e;
      }
    } else if (dateFilter && dateFilter !== 'All Time') {
      const now = new Date();
      let start = new Date(now);
      let end = new Date(now);

      switch (dateFilter) {
        case 'Today': {
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          query.createdAt = { $gte: start, $lte: end };
          break;
        }
        case 'Yesterday': {
          start.setDate(now.getDate() - 1);
          start.setHours(0, 0, 0, 0);
          end.setDate(now.getDate() - 1);
          end.setHours(23, 59, 59, 999);
          query.createdAt = { $gte: start, $lte: end };
          break;
        }
        case 'This Week': {
          start.setDate(now.getDate() - 7);
          start.setHours(0, 0, 0, 0);
          query.createdAt = { $gte: start };
          break;
        }
        case 'This Month': {
          start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          query.createdAt = { $gte: start };
          break;
        }
        case 'Last 30 Days': {
          start.setDate(now.getDate() - 30);
          start.setHours(0, 0, 0, 0);
          query.createdAt = { $gte: start };
          break;
        }
        default:
          break;
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

// Helper to extract real public or network IP of the caller
const getRealClientIp = (req) => {
  if (!req) return '127.0.0.1';
  const forwarded = req.headers ? req.headers['x-forwarded-for'] : null;
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim().replace(/^::ffff:/, '');
    if (firstIp) return firstIp;
  }
  const cfIp = req.headers ? req.headers['cf-connecting-ip'] : null;
  if (cfIp) return cfIp.trim();
  const realIp = req.headers ? req.headers['x-real-ip'] : null;
  if (realIp) return realIp.trim();

  let raw = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';
  raw = raw.replace(/^::ffff:/, '');
  if (raw === '::1' || raw === '127.0.0.1') {
    return '127.0.0.1';
  }
  return raw;
};

// Internal Helper for other controllers to use
const createAuditLog = async ({ user, role, action, module, details, ip, req }) => {
  try {
    let resolvedIp = ip;
    if (!resolvedIp && req) {
      resolvedIp = getRealClientIp(req);
    }
    if (resolvedIp) {
      resolvedIp = resolvedIp.replace(/^::ffff:/, '');
      if (resolvedIp === '::1') resolvedIp = '127.0.0.1';
    } else {
      resolvedIp = '127.0.0.1';
    }

    await AuditLog.create({
      user: user || 'Admin',
      role: role || 'System Administrator',
      action,
      module,
      details,
      ip: resolvedIp
    });
  } catch (error) {
    console.error('Failed to create audit log', error);
  }
};

module.exports = {
  getAuditLogs,
  createAuditLog,
  getRealClientIp
};
