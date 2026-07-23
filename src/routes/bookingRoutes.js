const express = require('express');
const router = express.Router();
const {
  createOrder,
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
  getAllBookingsAdmin,
  updateBookingStatusAdmin,
  startChargingRemote,
  stopChargingRemote,
} = require('../controllers/bookingController');
const { protect, protectUser, protectAdminOrUser } = require('../middlewares/authMiddleware');

// Charging Control (Admin/Partner/User)
router.put('/:id/start-charging', protectAdminOrUser, startChargingRemote);
router.put('/:id/stop-charging', protectAdminOrUser, stopChargingRemote);

// Admin routes
router.get('/admin/all', protect, getAllBookingsAdmin);
router.put('/admin/:id/status', protect, updateBookingStatusAdmin);
router.put('/admin/:id/start-charging', protect, startChargingRemote);
router.put('/admin/:id/stop-charging', protect, stopChargingRemote);

// User routes
router.post('/create-order', protectUser, createOrder);
router.post('/', protectUser, createBooking);
router.get('/my', protectUser, getMyBookings);
router.put('/:id/cancel', protectUser, cancelBooking);
router.put('/:id/reschedule', protectUser, rescheduleBooking);
router.get('/:id', protectUser, getBookingById);

module.exports = router;
