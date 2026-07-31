const User = require('../models/User');
const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');

// Update FCM token for the authenticated user
const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ success: false, message: 'fcmToken is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.fcmToken = fcmToken;
    await user.save();

    res.json({ success: true, message: 'FCM token updated successfully' });
  } catch (error) {
    console.error('Error updating FCM token:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get notifications for the authenticated user
const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50); // Get latest 50 notifications

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Mark notifications as read
const markAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body; // array of IDs
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ success: false, message: 'notificationIds array is required' });
    }

    await Notification.updateMany(
      { _id: { $in: notificationIds }, user: req.user._id },
      { $set: { isRead: true } }
    );

    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// For testing purpose only - Admin can trigger notification (You can remove this or protect it with Admin auth)
const testSendNotification = async (req, res) => {
  try {
    const { title, body, data } = req.body;
    const result = await notificationService.sendToUser(req.user._id, title, body, data, 'test');
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Send route proximity alert notification & persist to DB
const sendProximityAlert = async (req, res) => {
  try {
    const { stationId, stationName, distanceKm, title, body } = req.body;
    const notifTitle = title || `⚡ Charging Station Near You!`;
    const notifBody = body || `${stationName || 'A charging station'} is ${distanceKm ? Number(distanceKm).toFixed(1) : ''} km away on your route!`;

    const result = await notificationService.sendToUser(
      req.user._id,
      notifTitle,
      notifBody,
      { stationId: stationId || '', type: 'proximity_alert', distanceKm: distanceKm ? distanceKm.toString() : '' },
      'alert'
    );

    res.json({ success: true, notification: result.notification });
  } catch (error) {
    console.error('Error sending proximity alert:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  updateFcmToken,
  getUserNotifications,
  markAsRead,
  testSendNotification,
  sendProximityAlert
};

