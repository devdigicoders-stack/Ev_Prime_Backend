const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSetting,
  getStats,
  getSecurityEvents,
  runScan,
  getActiveSessions,
  terminateOtherSessions
} = require('../controllers/securityController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/settings', protect, getSettings);
router.put('/settings', protect, updateSetting);
router.get('/stats', protect, getStats);
router.get('/events', protect, getSecurityEvents);
router.post('/scan', protect, runScan);
router.get('/sessions', protect, getActiveSessions);
router.delete('/sessions/terminate-others', protect, terminateOtherSessions);

module.exports = router;
