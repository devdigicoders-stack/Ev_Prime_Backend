const Review = require('../models/Review');
const User = require('../models/User');

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
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Please provide rating and comment' });
    }

    const review = await Review.create({
      user: req.user._id, // Set by authMiddleware
      rating,
      comment
    });

    const populatedReview = await Review.findById(review._id).populate('user', 'name profileImage');

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
