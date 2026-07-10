const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  issueType: {
    type: String,
    enum: ['Battery Dead', 'Tyre Puncture', 'Accident', 'Charging Issue', 'Vehicle Breakdown', 'Other'],
    default: 'Other'
  },
  description: { type: String },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Cancelled'],
    default: 'Pending'
  },
  assignedTo: { type: String, default: '' },
  adminNote: { type: String, default: '' },
  resolvedAt: { type: Date },
}, {
  timestamps: true
});

module.exports = mongoose.model('Emergency', emergencySchema);
