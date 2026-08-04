const express = require('express');
const router = express.Router();
const { 
  getBanners, addBanner, updateBanner, deleteBanner,
  getChargingSolutions, addChargingSolution, updateChargingSolution, deleteChargingSolution
} = require('../controllers/cmsController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.route('/')
  .get(protect, getBanners)
  .post(protect, upload.single('bannerImage'), addBanner);

router.route('/:id')
  .put(protect, upload.single('bannerImage'), updateBanner)
  .delete(protect, deleteBanner);

// Charging Solutions Routes
router.route('/solutions')
  .get(getChargingSolutions)
  .post(protect, upload.single('solutionImage'), addChargingSolution);

router.route('/solutions/:id')
  .put(protect, upload.single('solutionImage'), updateChargingSolution)
  .delete(protect, deleteChargingSolution);

module.exports = router;
