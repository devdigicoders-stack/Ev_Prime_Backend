const Reward = require('../models/Reward');
const User = require('../models/User');

// @desc    Get user points and available rewards
// @route   GET /api/rewards
// @access  Private
const getRewards = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('rewardPoints tier');
    let rewards = await Reward.find({ isActive: true });

    // Seed default rewards if empty for testing
    if (rewards.length === 0) {
      await Reward.insertMany([
        { title: '₹50 Charging Voucher', pointsRequired: 500, icon: 'bolt', color: '#8CC63F' },
        { title: 'Free Coffee', pointsRequired: 300, icon: 'local_cafe', color: '#795548' },
        { title: 'Premium Wash', pointsRequired: 1000, icon: 'local_car_wash', color: '#2196F3' }
      ]);
      rewards = await Reward.find({ isActive: true });
    }

    res.json({
      success: true,
      data: {
        points: user.rewardPoints || 0,
        tier: user.tier || 'Silver',
        rewards
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getRewards
};
