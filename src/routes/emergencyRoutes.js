const express = require('express');
const router = express.Router();
const {
  raiseSOS, getMyEmergencies, cancelEmergency,
  getAllEmergencies, updateEmergencyStatus
} = require('../controllers/emergencyController');
const { protect, protectUser } = require('../middlewares/authMiddleware');

// User routes
router.post('/sos', protectUser, raiseSOS);
router.get('/my', protectUser, getMyEmergencies);
router.put('/:id/cancel', protectUser, cancelEmergency);

// Admin routes
router.get('/admin/all', protect, getAllEmergencies);
router.put('/admin/:id/status', protect, updateEmergencyStatus);

module.exports = router;
