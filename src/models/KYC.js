const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  aadhaarNumber: { type: String },
  aadhaarFront: { type: String },   // image URL
  aadhaarBack: { type: String },    // image URL
  panNumber: { type: String },
  panImage: { type: String },       // image URL
  selfie: { type: String },         // image URL
  status: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'pending' 
  },
  rejectionReason: { type: String },
  verifiedAt: { type: Date },
  verifiedBy: { type: String }      // admin identifier
}, { timestamps: true });

module.exports = mongoose.model('KYC', kycSchema);
