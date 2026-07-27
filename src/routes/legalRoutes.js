const express = require('express');
const router = express.Router();
const { getLegalDocument, updateLegalDocument } = require('../controllers/legalController');
const { protect } = require('../middlewares/authMiddleware');

// Public — app fetches these
router.get('/:type', getLegalDocument);

// Admin only — update content
router.put('/:type', protect, updateLegalDocument);

module.exports = router;
