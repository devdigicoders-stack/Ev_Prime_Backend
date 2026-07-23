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
    enum: ['Pending', 'Paid', 'Failed', 'Refunded', 'Refund Requested'],
    default: 'Pending',
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  status: {
    type: String,
    enum: ['Confirmed', 'Ongoing', 'Charging', 'Completed', 'Cancelled', 'No Show'],
    default: 'Confirmed',
  },
  chargingStartTime: { type: Date },
  chargingEndTime: { type: Date },
  unitsConsumed: { type: Number },
  duration: { type: Number },
  cancellationReason: { type: String },
  refundAmount: { type: Number },
  refundStatus: {
    type: String,
    enum: ['None', 'Initiated', 'Processed', 'Rejected'],
    default: 'None',
  },
  qrCode: { type: String },
  pin: { type: String },
  carbonSavedKg: { type: Number, default: 0 },
  fuelSavedLiters: { type: Number, default: 0 },
  treesEquivalent: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
