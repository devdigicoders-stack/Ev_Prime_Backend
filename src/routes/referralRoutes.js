const express = require('express');
const router = express.Router();
const { getReferralStats, applyReferralCode, getReferredFriends } = require('../controllers/referralController');
const { protectUser } = require('../middlewares/authMiddleware');

router.get('/stats', protectUser, getReferralStats);
router.post('/apply', protectUser, applyReferralCode);
router.get('/friends', protectUser, getReferredFriends);

module.exports = router;
