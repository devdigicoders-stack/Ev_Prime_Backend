const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: false, // Could be company name or specific query subject
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['General', 'Partner', 'Review'],
    required: true,
    default: 'General'
  },
  rating: {
    type: Number,
    required: false
  },
  role: {
    type: String,
    required: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['New', 'In Progress', 'Resolved'],
    default: 'New'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Enquiry', enquirySchema);
