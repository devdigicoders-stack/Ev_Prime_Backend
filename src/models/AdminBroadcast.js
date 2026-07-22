const mongoose = require('mongoose');

const adminBroadcastSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'general'
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null means sent to all users
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminBroadcast', adminBroadcastSchema);
