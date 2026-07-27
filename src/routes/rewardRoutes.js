const express = require('express');
const router = express.Router();
const { getRewards, checkDiscount, applyDiscount, addPoints } = require('../controllers/rewardController');
const { protectUser, protect } = require('../middlewares/authMiddleware');

router.get('/', protectUser, getRewards);
router.get('/discount-check', protectUser, checkDiscount);
router.post('/apply-discount', protectUser, applyDiscount);
router.post('/add-points', protect, addPoints);

module.exports = router;
