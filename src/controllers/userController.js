const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const jwt = require('jsonwebtoken');
const notificationService = require('../services/notificationService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/user/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, mobile, email } = req.body;
    
    if (!name || !mobile) {
       return res.status(400).json({ message: 'Name and mobile are required' });
    }

    const userExists = await User.findOne({ mobile });
    if (userExists) {
      return res.status(400).json({ message: 'User with this mobile already exists' });
    }

    const user = await User.create({ name, mobile, email });
    
    // Notify admins
    await notificationService.sendToAllAdmins(
      'New User Registered',
      `${name} (${mobile}) has just joined the platform.`,
      { userId: user._id.toString() },
      'alert'
    );

    res.status(201).json({
      _id: user._id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send OTP to user mobile
// @route   POST /api/user/send-otp
// @access  Public
const sendOtp = async (req, res) => {
  try {
    const { mobile, type } = req.body;
    
    if (!mobile) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    const user = await User.findOne({ mobile });
    
    if (type === 'login' && !user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }
    
    if (type === 'register' && user) {
      return res.status(400).json({ message: 'User with this mobile already exists. Please login.' });
    }

    // In a real application, you would integrate SMS gateway here (Twilio, MSG91, etc.)
    // For now, as requested, the OTP is fixed to '1234'
    
    res.json({ 
      success: true, 
      message: `OTP sent successfully to ${mobile}` 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user with mobile and OTP
// @route   POST /api/user/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    
    if (!mobile || !otp) {
      return res.status(400).json({ message: 'Mobile and OTP are required' });
    }

    if (otp !== '1234') {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Account is blocked. Please contact support.' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      status: user.status,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/user
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get full details of a user by ID
// @route   GET /api/user/:id
// @access  Private (Admin)
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (user) {
      const vehicles = await Vehicle.find({ user: user._id });
      let wallet = await Wallet.findOne({ user: user._id });
      let transactions = [];
      if (wallet) {
        transactions = await Transaction.find({ wallet: wallet._id }).sort({ createdAt: -1 });
      }
      res.json({ ...user, vehicles, wallet, transactions });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user profile
// @route   GET /api/user/profile
// @access  Private (User)
const getOwnProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Edit/Update a user's own profile
// @route   PUT /api/user/profile
// @access  Private (User)
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      if (req.file) {
        user.profileImage = `/uploads/${req.file.filename}`;
      } else if (req.body.profileImage) {
        user.profileImage = req.body.profileImage;
      }
      
      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/user/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await User.deleteOne({ _id: user._id });
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  sendOtp,
  loginUser,
  getAllUsers,
  getUserProfile,
  getOwnProfile,
  updateUserProfile,
  deleteUser
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Both fields required' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    // Since app uses OTP login (no password), we store password optionally
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    // If user has no password set, allow setting new one with any current
    if (user.password && user.password !== currentPassword) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};


// Delete own account
const deleteOwnAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── ADMIN ACTIONS ─────────────────────────────────────────────────────────

// @desc    Block a user
// @route   PUT /api/user/:id/block
// @access  Admin
const blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'blocked' }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User blocked successfully', user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc    Unblock a user
// @route   PUT /api/user/:id/unblock
// @access  Admin
const unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User unblocked successfully', user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc    Get user charging history
// @route   GET /api/user/:id/charging-history
// @access  Admin
const getUserChargingHistory = async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const bookings = await Booking.find({ user: req.params.id })
      .populate('station', 'name city location')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: bookings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc    Get user wallet details
// @route   GET /api/user/:id/wallet
// @access  Admin
const getUserWallet = async (req, res) => {
  try {
    const Refund = require('../models/Refund');
    let wallet = await Wallet.findOne({ user: req.params.id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.params.id, balance: 0 });
    }
    const transactions = await Transaction.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);
    const refunds = await Refund.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: { wallet, transactions, refunds } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc    Admin initiate wallet refund to user
// @route   POST /api/user/:id/wallet/refund or POST /api/user/:id/refund
// @access  Admin
const adminWalletRefund = async (req, res) => {
  try {
    const Refund = require('../models/Refund');
    const { amount, reason } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Valid amount required' });
    
    let wallet = await Wallet.findOne({ user: req.params.id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.params.id, balance: 0 });
    }
    
    wallet.balance += parseFloat(amount);
    await wallet.save();

    const refId = `REF_${Date.now()}`;

    const transaction = await Transaction.create({
      user: req.params.id,
      wallet: wallet._id,
      amount: parseFloat(amount),
      type: 'CREDIT',
      description: reason ? `Admin Refund: ${reason}` : 'Admin initiated refund',
      status: 'SUCCESS',
      referenceId: refId
    });

    const refund = await Refund.create({
      refundId: refId,
      user: req.params.id,
      amount: parseFloat(amount),
      paymentMethod: 'wallet',
      reason: reason || 'Admin initiated refund',
      status: 'Approved',
      refundDestination: 'wallet'
    });

    res.json({ success: true, message: `₹${amount} refunded & credited to wallet`, balance: wallet.balance, refund, transaction });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc    Get user refunds
// @route   GET /api/user/:id/refunds
// @access  Admin
const getUserRefunds = async (req, res) => {
  try {
    const Refund = require('../models/Refund');
    const refunds = await Refund.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: refunds });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc    Get user KYC details
// @route   GET /api/user/:id/kyc
// @access  Admin
const getUserKYC = async (req, res) => {
  try {
    const KYC = require('../models/KYC');
    const kyc = await KYC.findOne({ user: req.params.id });
    res.json({ success: true, data: kyc });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc    Update user KYC status (verify/reject)
// @route   PUT /api/user/:id/kyc/status
// @access  Admin
const updateKYCStatus = async (req, res) => {
  try {
    const KYC = require('../models/KYC');
    const { status, rejectionReason } = req.body;
    const updateData = { status };
    if (status === 'verified') updateData.verifiedAt = new Date();
    if (status === 'rejected') updateData.rejectionReason = rejectionReason || 'Documents rejected by admin';
    
    let kyc = await KYC.findOneAndUpdate(
      { user: req.params.id },
      updateData,
      { new: true, upsert: true }
    );
    res.json({ success: true, message: `KYC ${status} successfully`, data: kyc });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc    Submit user KYC (User App API)
// @route   POST /api/user/kyc/submit
// @access  Private (User)
const submitOwnKYC = async (req, res) => {
  try {
    const KYC = require('../models/KYC');
    const { aadhaarNumber, panNumber, aadhaarFront, aadhaarBack, panImage, selfie } = req.body;
    
    let updateData = {
      user: req.user._id,
      aadhaarNumber,
      panNumber,
      status: 'pending',
      rejectionReason: ''
    };

    if (req.files) {
      if (req.files.aadhaarFront) updateData.aadhaarFront = `/uploads/${req.files.aadhaarFront[0].filename}`;
      if (req.files.aadhaarBack) updateData.aadhaarBack = `/uploads/${req.files.aadhaarBack[0].filename}`;
      if (req.files.panImage) updateData.panImage = `/uploads/${req.files.panImage[0].filename}`;
      if (req.files.selfie) updateData.selfie = `/uploads/${req.files.selfie[0].filename}`;
    }

    if (aadhaarFront) updateData.aadhaarFront = aadhaarFront;
    if (aadhaarBack) updateData.aadhaarBack = aadhaarBack;
    if (panImage) updateData.panImage = panImage;
    if (selfie) updateData.selfie = selfie;

    const kyc = await KYC.findOneAndUpdate(
      { user: req.user._id },
      updateData,
      { new: true, upsert: true }
    );

    res.json({ success: true, message: 'KYC submitted successfully. Pending admin review.', data: kyc });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc    Get user's own KYC status (User App)
// @route   GET /api/user/kyc/me
// @access  Private (User)
const getOwnKYC = async (req, res) => {
  try {
    const KYC = require('../models/KYC');
    const kyc = await KYC.findOne({ user: req.user._id });
    res.json({ success: true, data: kyc });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc    Admin upload/edit user KYC documents directly
// @route   POST /api/user/:id/kyc
// @access  Admin
const adminSaveUserKYC = async (req, res) => {
  try {
    const KYC = require('../models/KYC');
    const { aadhaarNumber, panNumber, aadhaarFront, aadhaarBack, panImage, selfie, status } = req.body;
    
    let updateData = {
      user: req.params.id,
      aadhaarNumber,
      panNumber,
      status: status || 'pending'
    };

    if (req.files) {
      if (req.files.aadhaarFront) updateData.aadhaarFront = `/uploads/${req.files.aadhaarFront[0].filename}`;
      if (req.files.aadhaarBack) updateData.aadhaarBack = `/uploads/${req.files.aadhaarBack[0].filename}`;
      if (req.files.panImage) updateData.panImage = `/uploads/${req.files.panImage[0].filename}`;
      if (req.files.selfie) updateData.selfie = `/uploads/${req.files.selfie[0].filename}`;
    }

    if (aadhaarFront) updateData.aadhaarFront = aadhaarFront;
    if (aadhaarBack) updateData.aadhaarBack = aadhaarBack;
    if (panImage) updateData.panImage = panImage;
    if (selfie) updateData.selfie = selfie;

    const kyc = await KYC.findOneAndUpdate(
      { user: req.params.id },
      updateData,
      { new: true, upsert: true }
    );

    res.json({ success: true, message: 'KYC updated successfully by admin', data: kyc });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc    Change logged in user's password
// @route   PUT /api/user/change-password
// @access  Private (User)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.password && user.password.length > 0) {
      const isMatch = await user.matchPassword(currentPassword || '');
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

Object.assign(module.exports, { 
  changePassword, deleteOwnAccount,
  blockUser, unblockUser,
  getUserChargingHistory,
  getUserWallet, adminWalletRefund, getUserRefunds,
  getUserKYC, updateKYCStatus,
  submitOwnKYC, getOwnKYC, adminSaveUserKYC
});


