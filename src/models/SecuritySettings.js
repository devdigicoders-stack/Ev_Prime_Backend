const mongoose = require('mongoose');

const securitySettingsSchema = new mongoose.Schema(
  {
    twoFactor: {
      type: Boolean,
      default: true,
    },
    ipWhitelist: {
      type: Boolean,
      default: false,
    },
    sessionTimeout: {
      type: Boolean,
      default: true,
    },
    loginAlerts: {
      type: Boolean,
      default: true,
    },
    lastScanDate: {
      type: Date,
      default: Date.now,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SecuritySettings', securitySettingsSchema);
