const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  txnId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  user: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  method: {
    type: String,
    enum: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Success', 'Pending', 'Failed'],
    default: 'Pending',
  }
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
