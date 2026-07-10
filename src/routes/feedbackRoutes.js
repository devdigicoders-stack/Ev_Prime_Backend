const express = require('express');
const router = express.Router();
const { protectUser, protect } = require('../middlewares/authMiddleware');
const { submitFeedback, getMyFeedback, getPublicFeedback, markHelpful, getAllFeedback, replyFeedback, toggleVisibility, deleteFeedback } = require('../controllers/feedbackController');

// User routes
router.post('/', protectUser, submitFeedback);
router.get('/my', protectUser, getMyFeedback);
router.get('/public', getPublicFeedback);
router.put('/:id/helpful', markHelpful);

// Admin routes
router.get('/admin/all', protect, getAllFeedback);
router.put('/admin/:id/reply', protect, replyFeedback);
router.put('/admin/:id/visibility', protect, toggleVisibility);
router.delete('/admin/:id', protect, deleteFeedback);

module.exports = router;
