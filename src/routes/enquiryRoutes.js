const express = require('express');
const router = express.Router();
const { 
  submitEnquiry,
  getEnquiries,
  getReviews,
  getApprovedReviews,
  approveReview,
  updateEnquiryStatus,
  deleteEnquiry
} = require('../controllers/enquiryController');
const { protect } = require('../middlewares/authMiddleware');

// Public routes
router.post('/', submitEnquiry);
router.get('/reviews/public', getApprovedReviews);

// Admin routes
router.get('/', protect, getEnquiries);
router.get('/reviews', protect, getReviews);
router.put('/reviews/:id/approve', protect, approveReview);
router.put('/:id/status', protect, updateEnquiryStatus);
router.delete('/:id', protect, deleteEnquiry);

module.exports = router;
