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
    ref: 'Booking'
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
  },
  refundDestination: {
    type: String,
    enum: ['wallet', 'bank_transfer', 'upi'],
    default: 'wallet'
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    ifsc: String,
  },
  upiDetails: {
    upiId: String,
  }
}, { timestamps: true });

const Refund = mongoose.model('Refund', refundSchema);
module.exports = Refund;
