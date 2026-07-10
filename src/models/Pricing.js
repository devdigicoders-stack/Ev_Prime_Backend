const mongoose = require('mongoose');

const connectorPriceSchema = new mongoose.Schema({
  connectorType: { type: String, required: true }, // CCS2, CHAdeMO, Type2, AC
  pricePerUnit: { type: Number, required: true },   // ₹ per kWh
  powerKw: { type: Number },                        // kW capacity
}, { _id: false });

const peakHourSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // "18:00"
  endTime: { type: String, required: true },   // "22:00"
  multiplier: { type: Number, default: 1.5 },  // 1.5x price
  label: { type: String, default: 'Peak Hours' },
}, { _id: false });

const pricingSchema = new mongoose.Schema({
  // Scope: global OR station-specific
  scope: { type: String, enum: ['global', 'station'], default: 'global' },
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', default: null },

  name: { type: String, required: true },        // "Standard Pricing", "Mumbai Station Pricing"
  description: { type: String, default: '' },

  // Base price (fallback)
  basePricePerUnit: { type: Number, required: true, default: 18 }, // ₹/kWh

  // Per connector type pricing
  connectorPrices: [connectorPriceSchema],

  // Peak hour pricing
  peakHours: [peakHourSchema],

  // Flat session fee (optional)
  sessionFee: { type: Number, default: 0 },

  // GST %
  gstPercent: { type: Number, default: 18 },

  // Min/Max charge limits
  minChargeAmount: { type: Number, default: 10 },

  // Active status
  isActive: { type: Boolean, default: true },

  // Currency
  currency: { type: String, default: 'INR' },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

module.exports = mongoose.model('Pricing', pricingSchema);
