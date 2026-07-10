const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  powerCapacity: {
    type: Number, // in kW
  },
  connectors: {
    type: Number,
    required: true,
    default: 1
  },
  partner: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Maintenance', 'Offline'],
    default: 'Active'
  },
  image: {
    type: String,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Station', stationSchema);
