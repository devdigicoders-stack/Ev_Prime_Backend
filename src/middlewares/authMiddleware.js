const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Partner = require('../models/Partner');

const protect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select('-password');
      if (!req.admin) {
        return res.status(401).json({ message: 'Not authorized, admin not found' });
      }
      if (!req.admin.isActive) {
        return res.status(403).json({ message: 'Your account has been deactivated by super admin.' });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  return res.status(401).json({ message: 'Not authorized, no token' });
};

// Only superadmin can access this route
const isSuperAdmin = (req, res, next) => {
  if (req.admin && req.admin.adminType === 'superadmin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Super Admin only.' });
};

// Check if admin has permission for a specific module and action
const hasPermission = (module, action = 'view') => (req, res, next) => {
  if (!req.admin) return res.status(401).json({ message: 'Not authorized' });
  // superadmin always has full access
  if (req.admin.adminType === 'superadmin') return next();
  
  // subadmin must have the specific module.action or legacy module
  const hasLegacyAccess = req.admin.permissions.includes(module);
  const hasSpecificAccess = req.admin.permissions.includes(`${module}.${action}`);
  
  if (hasLegacyAccess || hasSpecificAccess) return next();
  return res.status(403).json({ message: `Access denied. You don't have permission for: ${module} (${action})` });
};

const protectUser = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      if (req.user.status === 'blocked') {
        return res.status(403).json({ message: 'Your account has been blocked by admin.' });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  return res.status(401).json({ message: 'Not authorized, no token' });
};

const protectPartner = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'partner') return res.status(401).json({ message: 'Not authorized as partner' });
      req.partner = await Partner.findById(decoded.id)
        .select('-appPassword')
        .populate('parentPartnerId', 'name _id');
      if (!req.partner) return res.status(401).json({ message: 'Partner not found' });
      if (req.partner.status === 'Blocked') return res.status(403).json({ message: 'Your account has been blocked. Contact admin.' });
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  return res.status(401).json({ message: 'Not authorized, no token' });
};

const protectAdminOrUser = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const admin = await Admin.findById(decoded.id).select('-password');
      if (admin) {
        req.admin = admin;
        return next();
      }
      
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        return next();
      }
      
      return res.status(401).json({ message: 'Not authorized as admin or user' });
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  return res.status(401).json({ message: 'Not authorized, no token' });
};

module.exports = { protect, protectUser, protectPartner, protectAdminOrUser, isSuperAdmin, hasPermission };
