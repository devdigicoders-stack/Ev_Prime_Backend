const mongoose = require('mongoose');

const supportSettingsSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      default: 'support@bharatev.com'
    },
    phone: {
      type: String,
      required: true,
      default: '1800-123-4567'
    },
    liveChatUrl: {
      type: String,
      default: '#'
    },
    timing: {
      type: String,
      default: 'Mon-Fri from 9am to 6pm'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportSettings', supportSettingsSchema);
