const express = require('express');
const router = express.Router();
const { getRewards } = require('../controllers/rewardController');
const { protectUser } = require('../middlewares/authMiddleware');

router.get('/', protectUser, getRewards);

module.exports = router;
