const express = require('express');
const router = express.Router();
const { getChatHistory, getChatPartners } = require('../controllers/chatController');

// Open endpoints for simplicity right now; in production we would add auth middlewares
router.get('/partners', getChatPartners);
router.get('/:partnerId', getChatHistory);

module.exports = router;
