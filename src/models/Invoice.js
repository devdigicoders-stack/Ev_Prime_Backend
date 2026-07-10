const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  // Snapshot fields (so invoice stays accurate even if data changes)
  userName: { type: String },
  userMobile: { type: String },
  userEmail: { type: String },
  stationName: { type: String },
  stationCity: { type: String },
  stationAddress: { type: String },
  stationPartner: { type: String },
  connectorType: { type: String },
  connectorPower: { type: String },
  scheduledDate: { type: String },
  scheduledTime: { type: String },
  chargeUpTo: { type: Number },
  estimatedEnergy: { type: Number },
  estimatedTime: { type: Number },
  pricePerUnit: { type: Number },
  baseAmount: { type: Number },
  gstAmount: { type: Number },
  totalAmount: { type: Number },
  paymentMethod: { type: String },
  transactionId: { type: String },
  bookingId: { type: String },
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
