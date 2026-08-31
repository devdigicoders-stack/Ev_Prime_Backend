const express = require('express');
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  sendCustomNotification,
  updateFcmToken,
  removeFcmToken,
  getAdminNotifications,
  markNotificationsRead,
  getBroadcastHistory,
  deleteBroadcast,
  resendBroadcast,
  getAllPayouts,
  updatePayoutStatus,
  getAllPartnerComplaints,
  updatePartnerComplaintStatus,
  replyToPartnerComplaint,
  getSubAdmins,
  createSubAdmin,
  updateSubAdmin,
  deleteSubAdmin,
  getPermissionsList
} = require('../controllers/adminController');
const { protect, isSuperAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.route('/profile')
  .get(protect, getAdminProfile)
  .put(protect, upload.single('profileImage'), updateAdminProfile);
router.put('/change-password', protect, changePassword);

// FCM Token
router.post('/update-fcm-token', protect, updateFcmToken);
router.delete('/fcm-token', protect, removeFcmToken);

// Notifications
router.get('/notifications', protect, getAdminNotifications);
router.put('/notifications/read', protect, markNotificationsRead);
router.post('/notifications/send', protect, sendCustomNotification);

// Broadcast History
router.get('/notifications/broadcasts', protect, getBroadcastHistory);
router.delete('/notifications/broadcasts/:id', protect, deleteBroadcast);
router.post('/notifications/broadcasts/:id/resend', protect, resendBroadcast);

// Payouts
router.get('/payouts', protect, getAllPayouts);
router.put('/payouts/:id/status', protect, updatePayoutStatus);

// Partner Complaints
router.get('/partner-complaints', protect, getAllPartnerComplaints);
router.put('/partner-complaints/:id/status', protect, updatePartnerComplaintStatus);
router.post('/partner-complaints/:id/reply', protect, replyToPartnerComplaint);

// Sub-Admin Management (SuperAdmin only)
router.get('/subadmins/permissions', protect, isSuperAdmin, getPermissionsList);
router.route('/subadmins')
  .get(protect, isSuperAdmin, getSubAdmins)
  .post(protect, isSuperAdmin, createSubAdmin);
router.route('/subadmins/:id')
  .put(protect, isSuperAdmin, updateSubAdmin)
  .delete(protect, isSuperAdmin, deleteSubAdmin);

module.exports = router;
