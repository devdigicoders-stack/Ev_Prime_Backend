const Reward = require('../models/Reward');
const User = require('../models/User');

const POINTS_FOR_DISCOUNT = 500;
const DISCOUNT_AMOUNT = 50; // ₹50 discount per 500 points

const updateTier = (points) => {
  if (points >= 5000) return 'Platinum';
  if (points >= 2000) return 'Gold';
  if (points >= 500) return 'Silver';
  return 'Bronze';
};

// @desc    Get user points, tier, rewards list
// @route   GET /api/rewards
// @access  Private
const getRewards = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('rewardPoints tier');
    let rewards = await Reward.find({ isActive: true });

    if (rewards.length === 0) {
      await Reward.insertMany([
        { title: '₹50 Charging Discount', pointsRequired: 500, icon: 'bolt', color: '#8CC63F' },
        { title: 'Free Coffee', pointsRequired: 300, icon: 'local_cafe', color: '#795548' },
        { title: 'Premium Wash', pointsRequired: 1000, icon: 'local_car_wash', color: '#2196F3' },
      ]);
      rewards = await Reward.find({ isActive: true });
    }

    const points = user.rewardPoints || 0;
    const discountsAvailable = Math.floor(points / POINTS_FOR_DISCOUNT);

    res.json({
      success: true,
      data: {
        points,
        tier: user.tier || 'Bronze',
        discountsAvailable,
        discountAmount: DISCOUNT_AMOUNT,
        pointsForDiscount: POINTS_FOR_DISCOUNT,
        rewards,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Check discount eligibility before booking
// @route   GET /api/rewards/discount-check
// @access  Private
const checkDiscount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('rewardPoints tier');
    const points = user.rewardPoints || 0;
    const eligible = points >= POINTS_FOR_DISCOUNT;

    res.json({
      success: true,
      data: {
        eligible,
        points,
        discountAmount: eligible ? DISCOUNT_AMOUNT : 0,
        pointsRequired: POINTS_FOR_DISCOUNT,
        pointsShortfall: eligible ? 0 : POINTS_FOR_DISCOUNT - points,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Apply reward discount during booking (deduct 500 pts, return ₹50 discount)
// @route   POST /api/rewards/apply-discount
// @access  Private
const applyDiscount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('rewardPoints tier');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.rewardPoints < POINTS_FOR_DISCOUNT) {
      return res.status(400).json({
        success: false,
        message: `You need at least ${POINTS_FOR_DISCOUNT} points to apply a discount. You have ${user.rewardPoints} points.`,
      });
    }

    const newPoints = user.rewardPoints - POINTS_FOR_DISCOUNT;
    const newTier = updateTier(newPoints);

    await User.findByIdAndUpdate(req.user._id, {
      rewardPoints: newPoints,
      tier: newTier,
    });

    res.json({
      success: true,
      message: `₹${DISCOUNT_AMOUNT} discount applied! ${POINTS_FOR_DISCOUNT} points deducted.`,
      data: {
        discountAmount: DISCOUNT_AMOUNT,
        pointsDeducted: POINTS_FOR_DISCOUNT,
        remainingPoints: newPoints,
        newTier,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Add points manually (admin use)
// @route   POST /api/rewards/add-points
// @access  Admin
const addPoints = async (req, res) => {
  try {
    const { userId, points, reason } = req.body;
    if (!userId || !points || points <= 0) {
      return res.status(400).json({ success: false, message: 'userId and positive points required' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { rewardPoints: points } },
      { new: true }
    ).select('rewardPoints tier name');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newTier = updateTier(user.rewardPoints);
    if (newTier !== user.tier) {
      await User.findByIdAndUpdate(userId, { tier: newTier });
    }

    res.json({
      success: true,
      message: `${points} points added to ${user.name}`,
      data: { rewardPoints: user.rewardPoints, tier: newTier },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { getRewards, checkDiscount, applyDiscount, addPoints };
