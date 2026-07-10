const express = require('express');
const router = express.Router();
const { generateReport } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/generate')
  .get(protect, generateReport);

module.exports = router;
