const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['User', 'Admin'],
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

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Charging Issue', 'Payment Issue', 'Refund Issue', 'App Issue', 'Station Issue', 'Hardware Issue', 'Other'],
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

// Pre-save hook to generate ticket ID
ticketSchema.pre('validate', function () {
  if (this.isNew && !this.ticketId) {
    // Basic unique ID generation: TKT-YYYY-RANDOM
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.ticketId = `TKT-${year}-${randomNum}`;
  }
});

module.exports = mongoose.model('Ticket', ticketSchema);
