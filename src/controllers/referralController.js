const User = require('../models/User');

// @desc    Get referral statistics and code
// @route   GET /api/referral/stats
// @access  Private
const getReferralStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // If user doesn't have a referral code yet, create one
    if (!user.referralCode) {
      user.referralCode = `EV${user.name.substring(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
      await user.save();
    }

    // Count how many users have used this referral code
    const friendsReferred = await User.countDocuments({ referredBy: user._id });

    // ₹50 earned per referral
    const totalEarned = friendsReferred * 50;

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        friendsReferred,
        totalEarned
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Apply a referral code (during registration or from screen)
// @route   POST /api/referral/apply
// @access  Private
const applyReferralCode = async (req, res) => {
  try {
    const { code } = req.body;
    const currentUser = await User.findById(req.user._id);

    if (!code) {
      return res.status(400).json({ success: false, message: 'Referral code is required' });
    }

    if (currentUser.referredBy) {
      return res.status(400).json({ success: false, message: 'You have already applied a referral code' });
    }

    // Find the referrer
    const referrer = await User.findOne({ referralCode: code.toUpperCase() });

    if (!referrer) {
      return res.status(404).json({ success: false, message: 'Invalid referral code' });
    }

    if (referrer._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot use your own referral code' });
    }

    // Mark this user as referred
    currentUser.referredBy = referrer._id;
    await currentUser.save();

    // Add ₹50 reward points to the referrer
    referrer.rewardPoints = (referrer.rewardPoints || 0) + 50;
    await referrer.save();

    res.json({ success: true, message: 'Referral code applied successfully! Your friend earned ₹50 in rewards.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get list of referred friends
// @route   GET /api/referral/friends
// @access  Private
const getReferredFriends = async (req, res) => {
  try {
    const friends = await User.find({ referredBy: req.user._id })
      .select('name mobile createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: friends.map(f => ({
        name: f.name,
        mobile: f.mobile.slice(0, 4) + '******' + f.mobile.slice(-2),
        joinedAt: f.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getReferralStats,
  applyReferralCode,
  getReferredFriends
};
