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
  deleteUser
} = require('../controllers/userController');
const { protect, protectUser } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.post('/register', registerUser);
router.post('/send-otp', sendOtp);
router.post('/login', loginUser);

// User protected route for fetching and editing own profile
router.route('/profile')
  .get(protectUser, getOwnProfile)
  .put(protectUser, upload.single('profileImage'), updateUserProfile);

// Admin protected routes
router.route('/')
  .get(protect, getAllUsers);

router.route('/:id')
  .get(protect, getUserProfile)
  .delete(protect, deleteUser);

module.exports = router;
