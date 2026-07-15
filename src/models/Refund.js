const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  refundId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
    default: 'wallet'
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Approved', 'Pending', 'Rejected'],
    default: 'Pending',
  }
}, { timestamps: true });

const Refund = mongoose.model('Refund', refundSchema);
module.exports = Refund;
