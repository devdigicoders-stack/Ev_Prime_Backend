const Payment = require('../models/Payment');

// @desc    Create a new payment (for testing/mocking)
// @route   POST /api/payment
// @access  Admin
const createPayment = async (req, res) => {
  try {
    const { txnId, user, amount, method, status } = req.body;

    const payment = await Payment.create({
      txnId,
      user,
      amount,
      method,
      status: status || 'Pending'
    });

    if (payment) {
      res.status(201).json(payment);
    } else {
      res.status(400).json({ message: 'Invalid payment data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all payments
// @route   GET /api/payment
// @access  Admin
const getAllPayments = async (req, res) => {
  try {
    // Sort by newest first
    const payments = await Payment.find({}).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete payment
// @route   DELETE /api/payment/:id
// @access  Admin
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    await payment.deleteOne();
    res.json({ message: 'Payment removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPayment,
  getAllPayments,
  deletePayment,
};
