const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['Partner', 'Admin'],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    }
  },
  { timestamps: true }
);

const partnerComplaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
    },
    station: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Station',
    },
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Charging Issue', 'Payment Issue', 'Payout Issue', 'App Issue', 'Station Hardware', 'Other'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    messages: [messageSchema]
  },
  { timestamps: true }
);

// Pre-save hook to generate complaint ID
partnerComplaintSchema.pre('validate', function () {
  if (this.isNew && !this.complaintId) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    this.complaintId = `COM-${year}-${randomNum}`;
  }
});

module.exports = mongoose.model('PartnerComplaint', partnerComplaintSchema);
