const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    enum: ['active', 'inactive', 'blocked'],
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

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    if (typeof next === 'function') next();
    return;
  }
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    if (typeof next === 'function') next();
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  if (typeof next === 'function') next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return true;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema, 'app_users');
