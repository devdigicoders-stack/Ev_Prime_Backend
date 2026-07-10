const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      default: 'Admin User',
    },
    action: {
      type: String,
      required: true,
      // e.g., 'Created', 'Updated', 'Deleted', 'Logged In', 'Failed Login'
    },
    module: {
      type: String,
      required: true,
      // e.g., 'Station Management', 'Ticket Management', 'Authentication'
    },
    details: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      default: '127.0.0.1',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
