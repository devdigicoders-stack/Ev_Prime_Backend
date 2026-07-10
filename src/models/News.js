const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  summary: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: null
  },
  category: {
    type: String,
    enum: ['Policy', 'Technology', 'Infrastructure', 'Tips', 'Market', 'General'],
    default: 'General'
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  source: {
    type: String,
    default: 'Bharat EV'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('News', newsSchema);
