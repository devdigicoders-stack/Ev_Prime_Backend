const mongoose = require('mongoose');

const legalDocumentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['privacy_policy', 'terms_conditions'],
    required: true,
    unique: true,
  },
  title: { type: String, required: true },
  content: { type: String, required: true }, // plain text / markdown
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('LegalDocument', legalDocumentSchema);
