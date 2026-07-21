const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
  },
  profileImage: {
    type: String,
    default: ''
  },
  rewardPoints: {
    type: Number,
    default: 0
  },
  tier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Silver'
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  password: {
    type: String,
    default: ''
  },
  fcmToken: {
    type: String,
    default: ''
  },
  totalCarbonSavedKg: { type: Number, default: 0 },
  totalFuelSavedLiters: { type: Number, default: 0 },
  totalEnergyConsumedKwh: { type: Number, default: 0 },
  totalTreesEquivalent: { type: Number, default: 0 },
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema, 'app_users');
