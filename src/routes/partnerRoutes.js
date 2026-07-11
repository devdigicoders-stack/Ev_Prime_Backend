const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/partnerController');
const { protect, protectPartner } = require('../middlewares/authMiddleware');

// Public
router.post('/login', partnerLogin);

// Partner self-service (partner app)
router.get('/me', protectPartner, getMyProfile);
router.get('/me/dashboard', protectPartner, getMyDashboard);
router.get('/me/stations', protectPartner, getMyStations);
router.get('/me/bookings', protectPartner, getMyBookings);
router.get('/me/revenue', protectPartner, getMyRevenue);

// Admin protected
router.post('/', protect, createPartner);
router.get('/', protect, getAllPartners);
router.put('/:id', protect, updatePartner);
router.delete('/:id', protect, deletePartner);
router.post('/:id/credentials', protect, setPartnerCredentials);
router.put('/:id/change-password', protect, changePartnerPassword);
router.get('/:id/history', protect, getPartnerHistory);

module.exports = router;
