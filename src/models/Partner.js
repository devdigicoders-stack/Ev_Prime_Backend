const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Blocked'],
    default: 'Active',
  },
  stationsCount: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

const Partner = mongoose.model('Partner', partnerSchema);
module.exports = Partner;
