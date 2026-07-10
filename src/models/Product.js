const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  category: { type: String, required: true, enum: ['Accessories', 'Cables & Adapters', 'Chargers', 'EV Care', 'Merchandise', 'Services'] },
  images: [{ type: String }],
  stock: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  tags: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
