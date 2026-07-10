const mongoose = require('mongoose');

const billingHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  status: { type: String, required: true },
});

const adminBillingSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      unique: true
    },
    planName: { type: String, default: 'Enterprise EV' },
    planPrice: { type: Number, default: 45000 },
    paymentMethodType: { type: String, default: 'VISA' },
    paymentMethodLast4: { type: String, default: '4242' },
    paymentMethodExpiry: { type: String, default: '12/26' },
    billingHistory: [billingHistorySchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminBilling', adminBillingSchema);
