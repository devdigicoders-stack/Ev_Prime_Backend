const mongoose = require('mongoose');

const partnerPayoutSchema = new mongoose.Schema({
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Completed', 'Rejected'], default: 'Pending' },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
  },
  remarks: { type: String },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('PartnerPayout', partnerPayoutSchema);
