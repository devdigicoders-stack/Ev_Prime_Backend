const express = require('express');
const router = express.Router();
const { getWallet, addMoney } = require('../controllers/walletController');
const { protectUser } = require('../middlewares/authMiddleware');

router.get('/', protectUser, getWallet);
router.post('/add', protectUser, addMoney);

module.exports = router;
