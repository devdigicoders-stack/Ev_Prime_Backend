const express = require('express');
const router = express.Router();
const { protectUser } = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');

// Update FCM token for the user
router.post('/update-fcm-token', protectUser, notificationController.updateFcmToken);

// Get user's notifications
router.get('/', protectUser, notificationController.getUserNotifications);

// Mark notifications as read
router.post('/mark-read', protectUser, notificationController.markAsRead);

// Test route (Can be removed in production or protected with Admin auth)
router.post('/test-send', protectUser, notificationController.testSendNotification);

module.exports = router;
