const express = require('express');
const router = express.Router();
const { getFAQs, getAllFAQsAdmin, createFAQ, updateFAQ, deleteFAQ } = require('../controllers/faqController');
const { protect } = require('../middlewares/authMiddleware');

// Public
router.get('/', getFAQs);

// Admin
router.get('/admin', protect, getAllFAQsAdmin);
router.post('/', protect, createFAQ);
router.put('/:id', protect, updateFAQ);
router.delete('/:id', protect, deleteFAQ);

module.exports = router;
