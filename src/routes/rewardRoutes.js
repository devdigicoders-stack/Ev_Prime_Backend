const express = require('express');
const router = express.Router();
const { getRewards, checkDiscount, applyDiscount, addPoints } = require('../controllers/rewardController');
const { protectUser, protectAdmin } = require('../middlewares/authMiddleware');

router.get('/', protectUser, getRewards);
router.get('/discount-check', protectUser, checkDiscount);
router.post('/apply-discount', protectUser, applyDiscount);
router.post('/add-points', protectAdmin, addPoints);

module.exports = router;
