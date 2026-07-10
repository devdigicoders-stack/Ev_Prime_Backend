const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  registrationNumber: {
    type: String,
    required: true,
  },
  connectorType: {
    type: String,
    required: true,
  },
  batteryCapacity: {
    type: Number, // in kWh
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
