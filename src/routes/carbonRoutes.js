const express = require('express');
const router = express.Router();
const { getCarbonData } = require('../controllers/carbonController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getCarbonData);

module.exports = router;
