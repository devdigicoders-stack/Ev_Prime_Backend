const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  station: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true,
  },
  connectorType: { type: String, required: true },
  connectorPower: { type: String },
  scheduledDate: { type: String, required: true },
  scheduledTime: { type: String, required: true },
  chargeUpTo: { type: Number, default: 80 },
  estimatedEnergy: { type: Number },
  estimatedTime: { type: Number },
  estimatedCost: { type: Number, required: true },
  pricePerUnit: { type: Number, default: 18 },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'wallet'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending',
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  status: {
    type: String,
    enum: ['Confirmed', 'Completed', 'Cancelled', 'No Show'],
    default: 'Confirmed',
  },
  cancellationReason: { type: String },
  refundAmount: { type: Number },
  refundStatus: {
    type: String,
    enum: ['None', 'Initiated', 'Processed'],
    default: 'None',
  },
  qrCode: { type: String },
  pin: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
