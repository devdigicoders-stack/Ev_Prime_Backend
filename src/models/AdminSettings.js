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

    // Contact & Social Media Info
    phone: { type: String, default: '+91 98765 43210' },
    contactEmail: { type: String, default: 'hello@bharatevprime.com' },
    address: { type: String, default: 'New Delhi, India' },
    facebookUrl: { type: String, default: 'https://facebook.com' },
    instagramUrl: { type: String, default: 'https://instagram.com' },
    linkedinUrl: { type: String, default: 'https://linkedin.com' },
    youtubeUrl: { type: String, default: 'https://youtube.com' },
    twitterUrl: { type: String, default: 'https://twitter.com' },

    // Tawk.to Live Chat Settings
    tawkEnabled: { type: Boolean, default: true },
    tawkPropertyId: { type: String, default: '' },
    tawkWidgetId: { type: String, default: 'default' },
    tawkDirectChatUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);
