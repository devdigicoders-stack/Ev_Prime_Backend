const mongoose = require('mongoose');

const chargingSolutionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Solution title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Solution description is required']
  },
  image: {
    type: String,
    required: [true, 'Solution image is required']
  },
  link: {
    type: String,
    default: '/download-app'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChargingSolution', chargingSolutionSchema);
