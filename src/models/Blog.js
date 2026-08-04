const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true
  },
  excerpt: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  coverImage: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['EV News', 'Tips & Tricks', 'Technology', 'Policy & Govt', 'Charging Guides', 'Industry'],
    default: 'EV News'
  },
  tags: [{
    type: String,
    trim: true
  }],
  author: {
    type: String,
    default: 'Bharat EV Prime Team'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: null
  },
  views: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Auto-generate slug from title before save
blogSchema.pre('save', function() {
  if (this.isModified('title') || !this.slug) {
    this.slug = (this.title || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now();
  }
});

module.exports = mongoose.model('Blog', blogSchema);
