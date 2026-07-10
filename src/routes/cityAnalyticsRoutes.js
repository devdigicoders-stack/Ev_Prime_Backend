const express = require('express');
const router = express.Router();
const { getCityAnalyticsData } = require('../controllers/cityAnalyticsController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getCityAnalyticsData);

module.exports = router;
