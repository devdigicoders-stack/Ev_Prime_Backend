const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      unique: true
    },
    // Platform Preferences
    language: { type: String, default: 'English (US)' },
    timezone: { type: String, default: '(GMT+05:30) India Standard Time' },
    currency: { type: String, default: 'INR (₹)' },
    
    // Notifications
    emailWeeklyReports: { type: Boolean, default: true },
    emailSupportTickets: { type: Boolean, default: true },
    emailPaymentFailures: { type: Boolean, default: false },
    pushStationOffline: { type: Boolean, default: true },
    pushCriticalErrors: { type: Boolean, default: true },
    
    // Appearance
    themeMode: { type: String, default: 'light' }, // light, dark, system
    fontFamily: { type: String, default: 'Outfit' }, // Inter, Roboto, Outfit
    
    // Integrations
    apiProductionKey: { type: String, default: 'pk_live_' + Math.random().toString(36).substr(2, 20) },
    stripeEnabled: { type: Boolean, default: true },
    awsEnabled: { type: Boolean, default: true },
    zendeskEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);
