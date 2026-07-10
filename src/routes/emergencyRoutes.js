const express = require('express');
const router = express.Router();
const { raiseSOS } = require('../controllers/emergencyController');
const { protectUser } = require('../middlewares/authMiddleware');

router.post('/sos', protectUser, raiseSOS);

module.exports = router;
