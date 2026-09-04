const checkPermission = (permission) => {
  return (req, res, next) => {
    // If not a sub-partner, full access is granted
    if (!req.partner || !req.partner.isSubPartner) {
      return next();
    }

    // Check if the sub-partner has the required permission
    if (req.partner.permissions && req.partner.permissions.includes(permission)) {
      return next();
    }

    // Permission denied
    return res.status(403).json({
      success: false,
      message: `Access Denied: You do not have permission for '${permission}'.`,
    });
  };
};

module.exports = { checkPermission };
