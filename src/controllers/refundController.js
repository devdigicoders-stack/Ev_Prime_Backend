const Refund = require('../models/Refund');
const Booking = require('../models/Booking');
const Wallet = require('../models/Wallet');
const { createAuditLog } = require('./auditController');
const notificationService = require('../services/notificationService');

// @desc    Create a new refund request (For Testing/App)
// @route   POST /api/refund
// @access  Admin
const createRefund = async (req, res) => {
  try {
    const { refundId, user, booking, amount, reason, status, paymentMethod } = req.body;

    const refund = await Refund.create({
      refundId,
      user,
      booking,
      amount,
      reason,
      paymentMethod: paymentMethod || 'wallet',
      status: status || 'Pending'
    });

    if (refund) {
      await createAuditLog({
        user: req.admin ? req.admin.name : 'System',
        role: req.admin ? req.admin.role : 'Super Admin',
        action: 'Created',
        module: 'Refund Management',
        details: `Refund request ${refundId} created.`,
        ip: req.ip
      });
      res.status(201).json(refund);
    } else {
      res.status(400).json({ message: 'Invalid refund data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all refunds
// @route   GET /api/refund
// @access  Admin
const getAllRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find({})
      .populate('user', 'name email')
      .populate('booking', 'bookingId paymentMethod')
      .sort({ createdAt: -1 });
    res.json(refunds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update refund status
// @route   PUT /api/refund/:id
// @access  Admin
const updateRefundStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Approved', 'Pending', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const refund = await Refund.findById(req.params.id);

    if (!refund) {
      return res.status(404).json({ message: 'Refund not found' });
    }

    if (refund.status !== 'Pending') {
      return res.status(400).json({ message: 'Refund is already processed' });
    }

      if (status === 'Approved') {
      const booking = await Booking.findById(refund.booking);
      if (booking) {
        booking.refundStatus = 'Processed';
        booking.paymentStatus = 'Refunded';
        await booking.save();
      }

      // Automatically add to wallet ONLY if refundDestination is 'wallet'
      if (refund.refundDestination === 'wallet' || (!refund.refundDestination && refund.paymentMethod === 'wallet')) {
        let wallet = await Wallet.findOne({ user: refund.user });
        if (!wallet) wallet = await Wallet.create({ user: refund.user, balance: 0, transactions: [] });
        
        wallet.balance += refund.amount;
        wallet.transactions = wallet.transactions || [];
        wallet.transactions.push({
          type: 'credit',
          amount: refund.amount,
          description: `Refund Approved for ${refund.refundId}`,
          date: new Date(),
        });
        await wallet.save();
      }

      // Notify User
      await notificationService.sendToUser(
        refund.user,
        'Refund Approved 💰',
        `Your refund of ₹${refund.amount.toFixed(2)} for ${refund.refundId} has been approved.`,
        { refundId: refund._id.toString() },
        'wallet'
      );
    } else if (status === 'Rejected') {
      const booking = await Booking.findById(refund.booking);
      if (booking) {
        booking.refundStatus = 'Rejected';
        await booking.save();
      }
    }

    refund.status = status;
    const updatedRefund = await refund.save();

    await createAuditLog({
      user: req.admin ? req.admin.name : 'System',
      role: req.admin ? req.admin.role : 'Super Admin',
      action: 'Updated',
      module: 'Refund Management',
      details: `Refund request ${updatedRefund.refundId} status updated to ${status}.`,
      ip: req.ip
    });

    res.json(updatedRefund);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete refund
// @route   DELETE /api/refund/:id
// @access  Admin
const deleteRefund = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id);

    if (!refund) {
      return res.status(404).json({ message: 'Refund not found' });
    }

    const refundId = refund.refundId;
    await refund.deleteOne();

    await createAuditLog({
      user: req.admin ? req.admin.name : 'System',
      role: req.admin ? req.admin.role : 'Super Admin',
      action: 'Deleted',
      module: 'Refund Management',
      details: `Refund request ${refundId} was deleted.`,
      ip: req.ip
    });

    res.json({ message: 'Refund removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRefund,
  getAllRefunds,
  updateRefundStatus,
  deleteRefund
};
