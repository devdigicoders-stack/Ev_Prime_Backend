const express = require('express');
const router = express.Router();
const { getAllReviews, createReview } = require('../controllers/reviewController');
const { protectUser } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protectUser, getAllReviews)
  .post(protectUser, createReview);

module.exports = router;
