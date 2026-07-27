const Review = require('../models/Review');
const User = require('../models/User');
const Station = require('../models/Station');
const notificationService = require('../services/notificationService');

// Helper: update tier based on points
const updateTier = (points) => {
  if (points >= 5000) return 'Platinum';
  if (points >= 2000) return 'Gold';
  if (points >= 500) return 'Silver';
  return 'Bronze';
};

// @desc    Get all reviews (latest first)
// @route   GET /api/reviews
// @access  Public (or Private if you want)
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name profileImage') // Get user name and profile image
      .sort({ createdAt: -1 })
      .limit(20); // Limit to top 20 recent reviews for performance

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { rating, comment, stationId } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Please provide rating and comment' });
    }

    const reviewData = {
      user: req.user._id,
      rating,
      comment
    };

    if (stationId) {
      const station = await Station.findById(stationId);
      if (station) {
        reviewData.station = stationId;
        reviewData.partner = station.partner; // Assuming partner is ObjectId in Station or string that maps to partner ID
      }
    }

    const review = await Review.create(reviewData);

    // ── Award 50 reward points for submitting a review ──
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { rewardPoints: 50 } },
      { new: true }
    );
    if (updatedUser) {
      const newTier = updateTier(updatedUser.rewardPoints);
      if (newTier !== updatedUser.tier) {
        await User.findByIdAndUpdate(req.user._id, { tier: newTier });
      }
      // Notify user about points
      await notificationService.sendToUser(
        req.user._id,
        'You earned 50 Reward Points! 🎉',
        'Thanks for your review! 50 points have been added to your account.',
        { type: 'reward' },
        'reward'
      ).catch(() => {});
    }

    const populatedReview = await Review.findById(review._id).populate('user', 'name profileImage');

    if (reviewData.partner) {
      await notificationService.sendToPartner(
        reviewData.partner,
        'New Station Review',
        `You received a new ${rating}-star review for your station.`,
        { type: 'new_review', reviewId: review._id.toString() },
        'alert'
      );
    }

    res.status(201).json({ success: true, data: populatedReview, message: 'Review submitted successfully!' });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getAllReviews,
  createReview
};
