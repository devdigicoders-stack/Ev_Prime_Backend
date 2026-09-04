const express = require('express');
const router = express.Router();
const {
  forgotPassword,
  verifyOtp,
  resetPassword,
  registerPartner,
  createPartner,
  getAllPartners,
  updatePartner,
  deletePartner,
  setPartnerCredentials,
  changePartnerPassword,
  getPartnerHistory,
  partnerLogin,
  getMyProfile,
  getMyStations,
  getMyBookings,
  getMyRevenue,
  getMyDashboard,
  addMyStation,
  updateMyStation,
  getStationAnalytics,
  updateMyProfile,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getMyStaff, addMyStaff, removeMyStaff, updateMyStaff,
  getMyPayouts, requestPayout,
  getMyPricingTemplates, createPricingTemplate, updatePricingTemplate, deletePricingTemplate,
  getMyPromotions, createPromotion, deletePromotion,
  updateMyBookingStatus,
  updateFcmToken,
  getMyNotifications,
  markNotificationsRead,
  getMyTransactions,
  getMyComplaints,
  createComplaint,
  getComplaintDetails,
  replyToComplaint,
  getMyReviews,
  getMyReports,
  getMySubPartners,
  addSubPartner,
  updateSubPartner,
  removeSubPartner
} = require('../controllers/partnerController');
const { protect, protectPartner } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public
router.post('/register', registerPartner);
router.post('/login', partnerLogin);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// Partner self-service (partner app)
const { startChargingRemote, stopChargingRemote } = require('../controllers/bookingController');

router.get('/me', protectPartner, getMyProfile);
router.get('/me/dashboard', protectPartner, checkPermission('view_dashboard'), getMyDashboard);
router.get('/me/stations', protectPartner, checkPermission('view_stations'), getMyStations);
router.post('/me/stations', protectPartner, checkPermission('manage_stations'), upload.single('image'), addMyStation);
router.put('/me/stations/:id', protectPartner, checkPermission('manage_stations'), upload.single('image'), updateMyStation);
router.get('/me/stations/:id/analytics', protectPartner, checkPermission('view_stations'), getStationAnalytics);
router.get('/me/bookings', protectPartner, checkPermission('view_bookings'), getMyBookings);
router.put('/me/bookings/:id/status', protectPartner, checkPermission('manage_bookings'), updateMyBookingStatus);
router.put('/me/bookings/:id/start-charging', protectPartner, checkPermission('manage_sessions'), startChargingRemote);
router.put('/me/bookings/:id/stop-charging', protectPartner, checkPermission('manage_sessions'), stopChargingRemote);
router.get('/me/revenue', protectPartner, checkPermission('view_revenue'), getMyRevenue);

// Profile
router.put('/me/profile', protectPartner, upload.single('logo'), updateMyProfile);

// Documents
router.post('/me/documents', protectPartner, upload.single('file'), uploadDocument);
router.put('/me/documents/:id', protectPartner, updateDocument);
router.delete('/me/documents/:id', protectPartner, deleteDocument);

// Staff
router.get('/me/staff', protectPartner, checkPermission('view_staff'), getMyStaff);
router.post('/me/staff', protectPartner, checkPermission('manage_staff'), upload.single('profilePic'), addMyStaff);
router.put('/me/staff/:staffId', protectPartner, checkPermission('manage_staff'), updateMyStaff);
router.delete('/me/staff/:staffId', protectPartner, checkPermission('manage_staff'), removeMyStaff);

// Sub-Partners (Staff permission applies to sub-partners too)
router.get('/me/sub-partners', protectPartner, checkPermission('view_staff'), getMySubPartners);
router.post('/me/sub-partners', protectPartner, checkPermission('manage_staff'), addSubPartner);
router.put('/me/sub-partners/:id', protectPartner, checkPermission('manage_staff'), updateSubPartner);
router.delete('/me/sub-partners/:id', protectPartner, checkPermission('manage_staff'), removeSubPartner);

// Payouts & Transactions
router.get('/me/payouts', protectPartner, checkPermission('view_payouts'), getMyPayouts);
router.post('/me/payouts', protectPartner, checkPermission('request_payout'), requestPayout);
router.get('/me/transactions', protectPartner, checkPermission('view_payouts'), getMyTransactions);

// Pricing Templates
router.get('/me/pricing-templates', protectPartner, checkPermission('view_pricing'), getMyPricingTemplates);
router.post('/me/pricing-templates', protectPartner, checkPermission('manage_pricing'), createPricingTemplate);
router.put('/me/pricing-templates/:id', protectPartner, checkPermission('manage_pricing'), updatePricingTemplate);
router.delete('/me/pricing-templates/:id', protectPartner, checkPermission('manage_pricing'), deletePricingTemplate);

// Promotions
router.get('/me/offers', protectPartner, checkPermission('view_promotions'), getMyPromotions);
router.post('/me/offers', protectPartner, checkPermission('manage_promotions'), createPromotion);
router.delete('/me/offers/:id', protectPartner, checkPermission('manage_promotions'), deletePromotion);

// Admin protected
router.post('/', protect, createPartner);
router.get('/', protect, getAllPartners);
router.put('/:id', protect, updatePartner);
router.delete('/:id', protect, deletePartner);
router.post('/:id/credentials', protect, setPartnerCredentials);
router.put('/:id/change-password', protect, changePartnerPassword);
router.get('/:id/history', protect, getPartnerHistory);

// Push Notifications
router.put('/me/fcm-token', protectPartner, updateFcmToken);
router.get('/me/notifications', protectPartner, getMyNotifications);
router.put('/me/notifications/read', protectPartner, markNotificationsRead);

// Complaints
router.get('/me/complaints', protectPartner, checkPermission('view_complaints'), getMyComplaints);
router.post('/me/complaints', protectPartner, checkPermission('manage_complaints'), createComplaint);
router.get('/me/complaints/:id', protectPartner, checkPermission('view_complaints'), getComplaintDetails);
router.post('/me/complaints/:id/reply', protectPartner, checkPermission('manage_complaints'), replyToComplaint);

// Reviews
router.get('/me/reviews', protectPartner, checkPermission('view_reviews'), getMyReviews);

// Reports
router.get('/me/reports', protectPartner, checkPermission('view_reports'), getMyReports);

module.exports = router;
