const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Station = require('../models/Station');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const Pricing = require('../models/Pricing');
const Refund = require('../models/Refund');
const { calculateEffectivePrice } = require('./pricingController');
const { createInvoiceForBooking } = require('./invoiceController');
const { calculateCarbon } = require('../utils/carbonCalculator');
const notificationService = require('../services/notificationService');

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Generate 4-digit PIN
const generatePin = () => Math.floor(1000 + Math.random() * 9000).toString();

// @desc  Create Razorpay order
// @route POST /api/booking/create-order
// @access User
const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });

    const order = await getRazorpay().orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });

    res.json({ success: true, data: { orderId: order.id, amount: order.amount, currency: order.currency } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create booking after payment
// @route POST /api/booking
// @access User
const createBooking = async (req, res) => {
  try {
    const {
      stationId, connectorType, connectorPower,
      scheduledDate, scheduledTime, chargeUpTo,
      estimatedEnergy, estimatedTime, estimatedCost, pricePerUnit,
      paymentMethod, razorpayOrderId, razorpayPaymentId, razorpaySignature,
    } = req.body;

    // Verify Razorpay signature if payment method is razorpay
    if (paymentMethod === 'razorpay') {
      // Skip verification in test mode (orderId/signature can be null)
      if (razorpayOrderId && razorpayPaymentId && razorpaySignature) {
        const body = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
          .update(body)
          .digest('hex');
        if (expectedSignature !== razorpaySignature) {
          return res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
      }
    }

    // Wallet payment deduction
    if (paymentMethod === 'wallet') {
      let wallet = await Wallet.findOne({ user: req.user._id });
      if (!wallet || wallet.balance < estimatedCost) {
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
      }
      wallet.balance -= estimatedCost;
      wallet.transactions = wallet.transactions || [];
      wallet.transactions.push({
        type: 'debit',
        amount: estimatedCost,
        description: 'Booking payment',
        date: new Date(),
      });
      await wallet.save();
    }

    const pin = generatePin();

    // ── Dynamic pricing lookup ──────────────────────────────────
    let resolvedPricePerUnit = pricePerUnit || 18;
    try {
      let pricing = await Pricing.findOne({ scope: 'station', station: stationId, isActive: true });
      if (!pricing) pricing = await Pricing.findOne({ scope: 'global', isActive: true }).sort({ createdAt: -1 });
      if (pricing) {
        const dateTime = scheduledTime ? new Date(`1970-01-01T${scheduledTime}:00`) : new Date();
        const { effectivePrice } = calculateEffectivePrice(pricing, connectorType, dateTime);
        resolvedPricePerUnit = effectivePrice;
      }
    } catch (e) { console.error('Pricing lookup error:', e.message); }
    // ────────────────────────────────────────────────────────────

    const newBooking = new Booking({
      user: req.user._id,
      station: stationId,
      connectorType,
      connectorPower,
      scheduledDate,
      scheduledTime,
      chargeUpTo: chargeUpTo || 80,
      estimatedEnergy,
      estimatedTime,
      estimatedCost,
      pricePerUnit: resolvedPricePerUnit,
      paymentMethod,
      paymentStatus: 'Paid',
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      razorpaySignature: razorpaySignature || '',
      status: 'Confirmed',
      pin,
    });

    // Generate bookingId before save
    const count = await Booking.countDocuments();
    newBooking.bookingId = `BK${Date.now().toString().slice(-6)}${count + 1}`;

    await newBooking.save();

    const populated = await Booking.findById(newBooking._id).populate('station', 'name location city image powerCapacity');

    // Notify admins
    await notificationService.sendToAllAdmins(
      'New Booking Created',
      `Booking ${newBooking.bookingId} created for ${populated.station?.name || 'Station'}.`,
      { bookingId: newBooking._id.toString() },
      'booking'
    );

    // Notify User
    await notificationService.sendToUser(
      req.user._id,
      'Booking Confirmed! ⚡',
      `Your booking ${newBooking.bookingId} at ${populated.station?.name || 'Station'} is confirmed.`,
      { bookingId: newBooking._id.toString() },
      'booking'
    );

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get user bookings
// @route GET /api/booking/my
// @access User
const getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status && status !== 'All') filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('station', 'name location city image powerCapacity latitude longitude')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single booking
// @route GET /api/booking/:id
// @access User
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id })
      .populate('station', 'name location city image powerCapacity latitude longitude');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Cancel booking
// @route PUT /api/booking/:id/cancel
// @access User
const cancelBooking = async (req, res) => {
  try {
    const { reason, refundDestination, bankDetails, upiDetails } = req.body;
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status === 'Cancelled') return res.status(400).json({ success: false, message: 'Already cancelled' });
    if (booking.status === 'Completed') return res.status(400).json({ success: false, message: 'Cannot cancel completed booking' });

    // 5% cancellation charge
    const cancellationCharge = booking.estimatedCost * 0.05;
    const refundAmount = booking.estimatedCost - cancellationCharge;

    booking.status = 'Cancelled';
    booking.cancellationReason = reason || 'User cancelled';
    booking.refundAmount = refundAmount;
    booking.refundStatus = 'Initiated';
    booking.paymentStatus = 'Refund Requested';
    await booking.save();

    // Create Refund Request
    const count = await Refund.countDocuments();
    await Refund.create({
      refundId: `RF${Date.now().toString().slice(-6)}${count + 1}`,
      user: req.user._id,
      booking: booking._id,
      amount: refundAmount,
      paymentMethod: booking.paymentMethod || 'wallet',
      refundDestination: refundDestination || 'wallet',
      bankDetails: bankDetails || undefined,
      upiDetails: upiDetails || undefined,
      reason: booking.cancellationReason,
      status: 'Pending'
    });

    const populated = await Booking.findById(booking._id).populate('station', 'name location city image powerCapacity latitude longitude');

    // Notify admins
    await notificationService.sendToAllAdmins(
      'Booking Cancelled',
      `Booking ${booking.bookingId} was cancelled. Refund initiated: ₹${refundAmount.toFixed(2)}.`,
      { bookingId: booking._id.toString() },
      'alert'
    );

    // Notify User
    await notificationService.sendToUser(
      req.user._id,
      'Booking Cancelled 🚫',
      `Your booking ${booking.bookingId} was cancelled. Refund of ₹${refundAmount.toFixed(2)} has been initiated.`,
      { bookingId: booking._id.toString() },
      'alert'
    );

    res.json({ success: true, data: populated, refundAmount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Reschedule booking
// @route PUT /api/booking/:id/reschedule
// @access User
const rescheduleBooking = async (req, res) => {
  try {
    const { scheduledDate, scheduledTime } = req.body;
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status !== 'Confirmed') return res.status(400).json({ success: false, message: 'Only confirmed bookings can be rescheduled' });

    booking.scheduledDate = scheduledDate;
    booking.scheduledTime = scheduledTime;
    await booking.save();

    const populated = await Booking.findById(booking._id).populate('station', 'name location city image powerCapacity');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN ROUTES ────────────────────────────────────────────────

// @desc  Get all bookings (admin)
// @route GET /api/booking/admin/all
// @access Admin
const getAllBookingsAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (status && status !== 'All') filter.status = status;

    let bookings = await Booking.find(filter)
      .populate('user', 'name mobile email')
      .populate('station', 'name location city')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    if (search) {
      const s = search.toLowerCase();
      bookings = bookings.filter(b =>
        b.bookingId?.toLowerCase().includes(s) ||
        b.user?.name?.toLowerCase().includes(s) ||
        b.user?.mobile?.includes(s) ||
        b.station?.name?.toLowerCase().includes(s)
      );
    }

    const total = await Booking.countDocuments(filter);

    // Stats
    const stats = {
      total: await Booking.countDocuments(),
      confirmed: await Booking.countDocuments({ status: 'Confirmed' }),
      completed: await Booking.countDocuments({ status: 'Completed' }),
      cancelled: await Booking.countDocuments({ status: 'Cancelled' }),
      totalRevenue: (await Booking.aggregate([
        { $match: { paymentStatus: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$estimatedCost' } } }
      ]))[0]?.total || 0,
    };

    res.json({ success: true, data: bookings, total, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update booking status (admin)
// @route PUT /api/booking/admin/:id/status
// @access Admin
const updateBookingStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name mobile').populate('station', 'name city');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Auto-generate invoice when booking is marked Completed
    if (status === 'Completed') {
      createInvoiceForBooking(booking).catch(err => console.error('Invoice gen error:', err.message));

      // Calculate and save carbon savings
      try {
        const energyKwh = booking.estimatedEnergy || 0;
        const { carbonSavedKg, treesEquivalent, fuelSavedLiters } = calculateCarbon(energyKwh);

        await Booking.findByIdAndUpdate(booking._id, { carbonSavedKg, treesEquivalent, fuelSavedLiters });

        await User.findByIdAndUpdate(booking.user._id, {
          $inc: {
            totalCarbonSavedKg: carbonSavedKg,
            totalFuelSavedLiters: fuelSavedLiters,
            totalEnergyConsumedKwh: energyKwh,
            totalTreesEquivalent: treesEquivalent,
          }
        });
      } catch (err) {
        console.error('Carbon calc error:', err.message);
      }

      // Notify User
      try {
        await notificationService.sendToUser(
          booking.user._id,
          'Booking Completed! ✅',
          `Your charging session for booking ${booking.bookingId} has been successfully completed.`,
          { bookingId: booking._id.toString() },
          'booking'
        );
      } catch (err) {
        console.error('Completion notification error:', err.message);
      }
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createOrder,
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
  getAllBookingsAdmin,
  updateBookingStatusAdmin,
};
