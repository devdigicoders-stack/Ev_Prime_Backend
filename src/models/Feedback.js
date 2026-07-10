const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['app', 'station', 'product', 'support'], required: true },
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', default: null },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketOrder', default: null },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, default: '' },
  comment: { type: String, required: true },
  adminReply: { type: String, default: '' },
  repliedAt: { type: Date, default: null },
  isPublic: { type: Boolean, default: true },
  helpfulCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
