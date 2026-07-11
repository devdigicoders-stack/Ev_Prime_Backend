const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const partnerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contactPerson: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Active', 'Blocked'], default: 'Active' },
  stationsCount: { type: Number, default: 0 },
  // App login credentials
  appUsername: { type: String, trim: true, sparse: true },
  appPassword: { type: String },
  hasCredentials: { type: Boolean, default: false },
  staff: [{
    name: String,
    email: String,
    role: { type: String, enum: ['Manager', 'Operator', 'Viewer'], default: 'Operator' },
    addedAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

partnerSchema.pre('save', async function () {
  if (!this.isModified('appPassword') || !this.appPassword) return;
  const salt = await bcrypt.genSalt(10);
  this.appPassword = await bcrypt.hash(this.appPassword, salt);
});

partnerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.appPassword);
};

const Partner = mongoose.model('Partner', partnerSchema);
module.exports = Partner;
