const express = require('express');
const router = express.Router();
const { getGovDashboardData } = require('../controllers/govController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getGovDashboardData);

module.exports = router;
