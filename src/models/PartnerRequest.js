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

const partnerRequestSchema = new mongoose.Schema(
  {
    requestId: {
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
      enum: ['Station Installation', 'Pricing Change', 'Connector Issue', 'Maintenance Request', 'New Station Approval', 'Other'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved', 'Closed'],
      default: 'Pending',
    },
    messages: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('PartnerRequest', partnerRequestSchema);
