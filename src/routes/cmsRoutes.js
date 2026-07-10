const express = require('express');
const router = express.Router();
const { getBanners, addBanner, updateBanner, deleteBanner } = require('../controllers/cmsController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.route('/')
  .get(protect, getBanners)
  .post(protect, upload.single('bannerImage'), addBanner);

router.route('/:id')
  .put(protect, upload.single('bannerImage'), updateBanner)
  .delete(protect, deleteBanner);

module.exports = router;
