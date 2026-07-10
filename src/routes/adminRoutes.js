const express = require('express');
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  changePassword
} = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.route('/profile')
  .get(protect, getAdminProfile)
  .put(protect, upload.single('profileImage'), updateAdminProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
