const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const partnerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contactPerson: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Pending', 'Active', 'Rejected', 'Blocked'], default: 'Pending' },
  stationsCount: { type: Number, default: 0 },
  // App login credentials
  appUsername: { type: String, trim: true, sparse: true },
  appPassword: { type: String },
  hasCredentials: { type: Boolean, default: false },
  fcmToken: { type: String, trim: true },
  
  // Password Reset
  resetPasswordOtp: { type: String },
  resetPasswordExpires: { type: Date },
  
  // Business Information
  gstNumber: { type: String, trim: true },
  panNumber: { type: String, trim: true },
  businessAddress: { type: String, trim: true },
  businessType: { type: String, trim: true },
  logo: { type: String },
  
  // Bank Details
  bankDetails: {
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    ifscCode: { type: String, trim: true },
    bankName: { type: String, trim: true },
    upiId: { type: String, trim: true },
  },

  // Tax Details
  taxDetails: {
    businessType: { type: String, trim: true },
    registrationDate: { type: String, trim: true },
    taxCollection: { type: String, trim: true },
    tdsApplicable: { type: Boolean, default: true },
  },
  
  // Security Settings
  securitySettings: {
    twoFactorEnabled: { type: Boolean, default: false },
    loginAlertsEnabled: { type: Boolean, default: true },
  },
  
  // Documents
  documents: [{
    title: { type: String, trim: true },
    category: { type: String, enum: ['Business', 'Legal', 'Tax'] },
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  staff: [{
    name: String,
    email: String,
    role: { type: String, enum: ['Owner', 'Manager', 'Employee'], default: 'Employee' },
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
