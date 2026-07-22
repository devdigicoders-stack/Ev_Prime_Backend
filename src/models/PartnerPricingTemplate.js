const mongoose = require('mongoose');

const partnerPricingTemplateSchema = new mongoose.Schema({
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  name: { type: String, required: true },
  acPrice: { type: Number, default: 0 },
  dcPrice: { type: Number, default: 0 },
  idleFee: { type: Number, default: 0 },
  sessionFee: { type: Number, default: 0 },
  peakPrice: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('PartnerPricingTemplate', partnerPricingTemplateSchema);
