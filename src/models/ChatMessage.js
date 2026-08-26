const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true,
    },
    senderModel: {
      type: String,
      required: true,
      enum: ['Partner', 'User'], // We use 'User' for Admin (since admins are in User table with role Admin)
    },
    receiverId: {
      type: String,
      required: true,
    },
    receiverModel: {
      type: String,

      required: true,
      enum: ['Partner', 'User'],
    },
    text: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
