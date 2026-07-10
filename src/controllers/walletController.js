const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

// @desc    Get user wallet balance & recent transactions
// @route   GET /api/wallet
// @access  Private
const getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });
    
    // Create wallet if it doesn't exist for user
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id, balance: 0 });
    }

    const transactions = await Transaction.find({ wallet: wallet._id })
      .sort({ createdAt: -1 })
      .limit(10); // get last 10 transactions

    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
        transactions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Add money to wallet
// @route   POST /api/wallet/add
// @access  Private
const addMoney = async (req, res) => {
  try {
    const { amount, referenceId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id, balance: 0 });
    }

    // Add balance
    wallet.balance += Number(amount);
    await wallet.save();

    // Create transaction record
    const transaction = await Transaction.create({
      user: req.user._id,
      wallet: wallet._id,
      amount: Number(amount),
      type: 'CREDIT',
      status: 'SUCCESS',
      description: 'Added money to wallet via Payment Gateway',
      referenceId: referenceId || 'TXN_' + Date.now()
    });

    res.status(200).json({
      success: true,
      message: 'Money added successfully',
      data: {
        balance: wallet.balance,
        transaction
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getWallet,
  addMoney
};
