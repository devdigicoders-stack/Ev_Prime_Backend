const express = require('express');
const router = express.Router();
const { uploadImage } = require('../controllers/uploadController');
const { protect } = require('../middlewares/authMiddleware');

// POST /api/upload/image  (Admin only)
router.post('/image', protect, uploadImage);

module.exports = router;
