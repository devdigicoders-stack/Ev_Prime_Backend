const express = require('express');
const router = express.Router();
const { generateReport, getAnalyticsReportAdmin } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/analytics', protect, getAnalyticsReportAdmin);
router.get('/generate', protect, generateReport);

module.exports = router;
