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
  blockUser,
  unblockUser,
  getUserChargingHistory,
  getUserWallet,
  adminWalletRefund,
  getUserRefunds,
  getUserKYC,
  updateKYCStatus,
  submitOwnKYC,
  getOwnKYC,
  adminSaveUserKYC
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

// User KYC Submission (Mobile App)
router.get('/kyc/me', protectUser, getOwnKYC);
router.post('/kyc/submit', protectUser, upload.fields([
  { name: 'aadhaarFront', maxCount: 1 },
  { name: 'aadhaarBack', maxCount: 1 },
  { name: 'panImage', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), submitOwnKYC);

router.route('/')
  .get(protect, getAllUsers);

router.route('/:id')
  .get(protect, getUserProfile)
  .delete(protect, deleteUser);

// Admin-only user management routes
router.put('/:id/block', protect, blockUser);
router.put('/:id/unblock', protect, unblockUser);
router.get('/:id/charging-history', protect, getUserChargingHistory);
router.get('/:id/wallet', protect, getUserWallet);
router.post('/:id/wallet/refund', protect, adminWalletRefund);
router.post('/:id/refund', protect, adminWalletRefund);
router.get('/:id/refunds', protect, getUserRefunds);
router.get('/:id/kyc', protect, getUserKYC);
router.post('/:id/kyc', protect, upload.fields([
  { name: 'aadhaarFront', maxCount: 1 },
  { name: 'aadhaarBack', maxCount: 1 },
  { name: 'panImage', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), adminSaveUserKYC);
router.put('/:id/kyc/status', protect, updateKYCStatus);

module.exports = router;
