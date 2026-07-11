const mongoose = require('mongoose');

const connectorTypeSchema = new mongoose.Schema({
  type: { type: String, required: true },      // CCS2, CHAdeMO, Type2, AC
  powerKw: { type: Number, required: true },   // kW
  pricePerUnit: { type: Number, required: true }, // ₹/kWh
  totalCount: { type: Number, default: 1 },
  availableCount: { type: Number, default: 1 },
  chargeType: { type: String, enum: ['AC', 'DC'], default: 'DC' },
}, { _id: false });

const stationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  powerCapacity: { type: Number },
  connectors: { type: Number, required: true, default: 1 },
  connectorTypes: [connectorTypeSchema],
  partner: { type: String, required: true },
  status: {
    type: String,
    enum: ['Active', 'Maintenance', 'Offline'],
    default: 'Active'
  },
  image: { type: String },
  amenities: [{ type: String }],
  openHours: { type: String, default: '24/7' },
  pricing: {
    acPrice: { type: Number, default: 18.00 },
    dcPrice: { type: Number, default: 24.00 },
    idleFee: { type: Number, default: 2.00 },
    sessionFee: { type: Number, default: 20.00 },
    peakPrice: { type: Number, default: 26.00 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Station', stationSchema);
