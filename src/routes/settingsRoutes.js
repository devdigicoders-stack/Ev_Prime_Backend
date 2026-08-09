const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  updateBilling,
  generateApiKey,
  getPublicSettings
} = require('../controllers/settingsController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/public', getPublicSettings);
router.get('/', protect, getSettings);
router.put('/', protect, updateSettings);
router.put('/billing', protect, updateBilling);
router.post('/apikey', protect, generateApiKey);

module.exports = router;
