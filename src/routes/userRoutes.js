const express = require('express');
const router = express.Router();
const {
  registerUser,
  sendOtp,
  loginUser,
  getAllUsers,
  getUserProfile,
  getOwnProfile,
  updateUserProfile,
  deleteUser,
  changePassword,
  deleteOwnAccount,
} = require('../controllers/userController');
const { protect, protectUser } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.post('/register', registerUser);
router.post('/send-otp', sendOtp);
router.post('/login', loginUser);

router.route('/profile')
  .get(protectUser, getOwnProfile)
  .put(protectUser, upload.single('profileImage'), updateUserProfile);

router.put('/change-password', protectUser, changePassword);
router.delete('/account', protectUser, deleteOwnAccount);

router.route('/')
  .get(protect, getAllUsers);

router.route('/:id')
  .get(protect, getUserProfile)
  .delete(protect, deleteUser);

module.exports = router;
