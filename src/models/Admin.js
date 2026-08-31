const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// All available permissions in the system
const ALL_PERMISSIONS = [
  'dashboard', 'users', 'bookings', 'stations', 'partners', 'partner-complaints',
  'payments', 'payouts', 'refunds', 'offers', 'news', 'emergency', 'feedback',
  'pricing', 'tickets', 'support', 'enquiries', 'newsletter', 'our-team',
  'reviews', 'blog', 'faq', 'marketplace', 'franchise', 'analytics', 'carbon',
  'gov', 'heatmap', 'cities', 'cms', 'connectors', 'reports', 'audit', 'security', 'settings'
];

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  // 'superadmin' has full access, 'subadmin' has only permitted modules
  adminType: {
    type: String,
    enum: ['superadmin', 'subadmin'],
    default: 'superadmin'
  },
  // Array of module keys this sub-admin can access
  permissions: {
    type: [String],
    default: []
  },
  // Display role title (e.g. "Station Manager", "Support Agent")
  role: {
    type: String,
    default: 'System Administrator'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String
  },
  phone: {
    type: String
  },
  location: {
    type: String
  },
  office: {
    type: String
  },
  profileImage: {
    type: String
  },
  fcmToken: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Pre-save hook to hash password before saving
adminSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
module.exports.ALL_PERMISSIONS = ALL_PERMISSIONS;
