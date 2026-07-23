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
  getMyPromotions, createPromotion,
  updateMyBookingStatus,
  updateFcmToken,
  getMyNotifications,
  markNotificationsRead,
  getMyTransactions
} = require('../controllers/partnerController');
const { protect, protectPartner } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public
router.post('/register', registerPartner);
router.post('/login', partnerLogin);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// Partner self-service (partner app)
router.get('/me', protectPartner, getMyProfile);
router.get('/me/dashboard', protectPartner, getMyDashboard);
router.get('/me/stations', protectPartner, getMyStations);
router.post('/me/stations', protectPartner, upload.single('image'), addMyStation);
router.put('/me/stations/:id', protectPartner, upload.single('image'), updateMyStation);
router.get('/me/stations/:id/analytics', protectPartner, getStationAnalytics);
router.get('/me/bookings', protectPartner, getMyBookings);
router.put('/me/bookings/:id/status', protectPartner, updateMyBookingStatus);
router.get('/me/revenue', protectPartner, getMyRevenue);

// Profile
router.put('/me/profile', protectPartner, upload.single('logo'), updateMyProfile);

// Documents
router.post('/me/documents', protectPartner, upload.single('file'), uploadDocument);
router.put('/me/documents/:id', protectPartner, updateDocument);
router.delete('/me/documents/:id', protectPartner, deleteDocument);

// Staff
router.get('/me/staff', protectPartner, getMyStaff);
router.post('/me/staff', protectPartner, addMyStaff);
router.put('/me/staff/:staffId', protectPartner, updateMyStaff);
router.delete('/me/staff/:staffId', protectPartner, removeMyStaff);

// Payouts & Transactions
router.get('/me/payouts', protectPartner, getMyPayouts);
router.post('/me/payouts', protectPartner, requestPayout);
router.get('/me/transactions', protectPartner, getMyTransactions);

// Pricing Templates
router.get('/me/pricing-templates', protectPartner, getMyPricingTemplates);
router.post('/me/pricing-templates', protectPartner, createPricingTemplate);
router.put('/me/pricing-templates/:id', protectPartner, updatePricingTemplate);
router.delete('/me/pricing-templates/:id', protectPartner, deletePricingTemplate);

// Promotions
router.get('/me/offers', protectPartner, getMyPromotions);
router.post('/me/offers', protectPartner, createPromotion);

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

module.exports = router;
