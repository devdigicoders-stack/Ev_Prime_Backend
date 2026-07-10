const mongoose = require('mongoose');

const marketOrderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String },
    image: { type: String },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, default: 1 },
  }],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['wallet', 'razorpay'], required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  deliveryAddress: { type: String, default: '' },
  trackingId: { type: String, default: '' },
  adminNote: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('MarketOrder', marketOrderSchema);
