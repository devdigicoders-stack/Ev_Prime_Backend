const MarketOrder = require('../models/MarketOrder');
const Product = require('../models/Product');
const Wallet = require('../models/Wallet');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const notificationService = require('../services/notificationService');

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc  Create Razorpay order for marketplace
// @route POST /api/market/orders/create-razorpay-order
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const order = await getRazorpay().orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `mkt_${Date.now()}`,
    });
    res.json({ success: true, data: { orderId: order.id, amount: order.amount, currency: order.currency } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Place order
// @route POST /api/market/orders
const placeOrder = async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod, deliveryAddress, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'No items in order' });
    if (!deliveryAddress) return res.status(400).json({ success: false, message: 'Delivery address required' });

    // Verify Razorpay
    if (paymentMethod === 'razorpay' && razorpayOrderId && razorpayPaymentId && razorpaySignature) {
      const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
      if (expected !== razorpaySignature) return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Wallet deduction
    if (paymentMethod === 'wallet') {
      const wallet = await Wallet.findOne({ user: req.user._id });
      if (!wallet || wallet.balance < totalAmount) return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
      wallet.balance -= totalAmount;
      wallet.transactions = wallet.transactions || [];
      wallet.transactions.push({ type: 'debit', amount: totalAmount, description: 'Marketplace order payment', date: new Date() });
      await wallet.save();
    }

    // Fetch product details for snapshot
    const orderItems = await Promise.all(items.map(async (item) => {
      const product = await Product.findById(item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);
      if (product.stock < item.qty) throw new Error(`Insufficient stock for ${product.name}`);
      return {
        product: product._id,
        name: product.name,
        image: product.images[0] || '',
        price: product.price,
        qty: item.qty,
      };
    }));

    // Decrement stock after order creation
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.qty } });
    }

    const count = await MarketOrder.countDocuments();
    const orderId = `MKT${Date.now().toString().slice(-6)}${count + 1}`;

    const order = await MarketOrder.create({
      orderId,
      user: req.user._id,
      items: orderItems,
      totalAmount,
      paymentMethod,
      paymentStatus: 'Paid',
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      deliveryAddress,
      status: 'Confirmed',
    });

    // Notify admins
    await notificationService.sendToAllAdmins(
      'New Marketplace Order',
      `Order ${order.orderId} for ₹${totalAmount.toFixed(2)} placed successfully.`,
      { orderId: order._id.toString() },
      'promo'
    );

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get my orders
// @route GET /api/market/orders/my
const getMyOrders = async (req, res) => {
  try {
    const orders = await MarketOrder.find({ user: req.user._id })
      .populate('items.product', 'name images price')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Cancel order (user)
// @route PUT /api/market/orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    const order = await MarketOrder.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['Pending', 'Confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${order.status} order` });
    }

    order.status = 'Cancelled';
    // Refund to wallet
    if (order.paymentMethod === 'wallet') {
      let wallet = await Wallet.findOne({ user: req.user._id });
      if (!wallet) wallet = await Wallet.create({ user: req.user._id, balance: 0, transactions: [] });
      wallet.balance += order.totalAmount;
      wallet.transactions.push({ type: 'credit', amount: order.totalAmount, description: `Refund for order #${order.orderId}`, date: new Date() });
      await wallet.save();
    }
    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
    }
    await order.save();

    // Notify admins
    await notificationService.sendToAllAdmins(
      'Marketplace Order Cancelled',
      `Order ${order.orderId} was cancelled by the user.`,
      { orderId: order._id.toString() },
      'alert'
    );

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN ────────────────────────────────────────────────────────

// @desc  Get all orders (admin)
// @route GET /api/market/admin/orders
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'All') filter.status = status;

    const orders = await MarketOrder.find(filter)
      .populate('user', 'name mobile email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await MarketOrder.countDocuments(filter);
    const stats = {
      total: await MarketOrder.countDocuments(),
      pending: await MarketOrder.countDocuments({ status: 'Pending' }),
      confirmed: await MarketOrder.countDocuments({ status: 'Confirmed' }),
      shipped: await MarketOrder.countDocuments({ status: 'Shipped' }),
      delivered: await MarketOrder.countDocuments({ status: 'Delivered' }),
      cancelled: await MarketOrder.countDocuments({ status: 'Cancelled' }),
      revenue: (await MarketOrder.aggregate([
        { $match: { paymentStatus: 'Paid', status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]))[0]?.total || 0,
    };

    res.json({ success: true, data: orders, total, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update order status (admin)
// @route PUT /api/market/admin/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingId, adminNote } = req.body;
    const update = { status };
    if (trackingId !== undefined) update.trackingId = trackingId;
    if (adminNote !== undefined) update.adminNote = adminNote;

    const order = await MarketOrder.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user', 'name mobile');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createRazorpayOrder, placeOrder, getMyOrders, cancelOrder, getAllOrders, updateOrderStatus };
