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

Object.assign(module.exports, { changePassword, deleteOwnAccount });

