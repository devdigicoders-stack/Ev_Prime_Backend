const express = require('express');
const router = express.Router();
const { getCarbonData, getMyCarbonStats } = require('../controllers/carbonController');
const { protect, protectUser } = require('../middlewares/authMiddleware');

router.get('/', protect, getCarbonData);           // Admin dashboard
router.get('/my', protectUser, getMyCarbonStats);  // User personal stats

module.exports = router;
