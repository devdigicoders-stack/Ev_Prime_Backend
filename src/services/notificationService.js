const { getApps } = require('../config/firebase');
const { getMessaging } = require('firebase-admin/messaging');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Admin = require('../models/Admin');
const AdminNotification = require('../models/AdminNotification');
const Partner = require('../models/Partner');
const PartnerNotification = require('../models/PartnerNotification');

class NotificationService {
  /**
   * Send a push notification to a specific user and save it in the database.
   * @param {String} userId - The ID of the user.
   * @param {String} title - Notification title.
   * @param {String} body - Notification body.
   * @param {Object} data - Additional data payload.
   * @param {String} type - Notification type (e.g., 'booking', 'promo').
   */
  async sendToUser(userId, title, body, data = {}, type = 'general') {
    try {
      // 1. Save to Database
      const notification = new Notification({
        user: userId,
        title,
        body,
        data,
        type
      });
      await notification.save();

      // 2. Fetch User to get FCM Token
      const user = await User.findById(userId);
      if (!user || !user.fcmToken) {
        console.log(`User ${userId} not found or has no FCM token. Notification saved to DB only.`);
        return { success: true, savedToDb: true, pushSent: false };
      }

      // 3. Send Push Notification via Firebase
      if (getApps().length > 0) {
        const message = {
          notification: {
            title,
            body
          },
          data: {
            ...data,
            type
          },
          token: user.fcmToken
        };

        const response = await getMessaging().send(message);
        console.log(`Successfully sent message to user ${userId}:`, response);
        return { success: true, savedToDb: true, pushSent: true, messageId: response };
      } else {
        console.log('Firebase Admin not initialized. Skipping push notification.');
        return { success: true, savedToDb: true, pushSent: false, error: 'Firebase not initialized' };
      }
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a push notification to multiple users.
   */
  async sendToMultipleUsers(userIds, title, body, data = {}, type = 'general') {
    try {
      const results = await Promise.all(
        userIds.map(id => this.sendToUser(id, title, body, data, type))
      );
      return { success: true, results };
    } catch (error) {
      console.error('Error sending multi-user notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a push notification to all Admins (e.g. for new bookings, new users, feedback)
   */
  async sendToAllAdmins(title, body, data = {}, type = 'alert') {
    try {
      // Save notification to DB for persistence
      const savedNotification = await AdminNotification.create({ title, body, data, type });

      if (!getApps().length) {
        return { success: false, error: 'Firebase not initialized', notification: savedNotification };
      }

      const admins = await Admin.find({ fcmToken: { $ne: '', $exists: true } });
      const tokens = admins.map(a => a.fcmToken).filter(Boolean);

      if (tokens.length === 0) {
        return { success: true, message: 'No admins with valid FCM token found', notification: savedNotification };
      }

      const message = {
        notification: { title, body },
        data: { ...data, type, notificationId: savedNotification._id.toString() },
        tokens
      };

      const response = await getMessaging().sendEachForMulticast(message);
      console.log(`Successfully sent message to ${response.successCount} admins`, response);
      return { success: true, response, notification: savedNotification };
    } catch (error) {
      console.error('Error sending notification to admins:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a push notification to all Users (e.g. for new stations, general promos)
   */
  async sendToAllUsers(title, body, data = {}, type = 'general') {
    try {
      const allUsers = await User.find({});
      if (allUsers.length > 0) {
        const notifications = allUsers.map(user => ({
          user: user._id,
          title,
          body,
          data,
          type,
          isRead: false
        }));
        await Notification.insertMany(notifications);
      }

      if (getApps().length > 0) {
        const usersWithToken = allUsers.filter(u => u.fcmToken);
        const tokens = usersWithToken.map(u => u.fcmToken).filter(Boolean);
        if (tokens.length > 0) {
          const message = {
            notification: { title, body },
            data: { ...data, type },
            tokens
          };
          await getMessaging().sendEachForMulticast(message);
        }
      }
      return { success: true, count: allUsers.length };
    } catch (error) {
      console.error('Error sending notification to users:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a push notification to a specific partner and save it in the database.
   * @param {String} partnerId - The ID of the partner.
   * @param {String} title - Notification title.
   * @param {String} body - Notification body.
   * @param {Object} data - Additional data payload.
   * @param {String} type - Notification type (e.g., 'booking', 'payout').
   */
  async sendToPartner(partnerId, title, body, data = {}, type = 'general') {
    try {
      // 1. Save to Database
      const notification = new PartnerNotification({
        partner: partnerId,
        title,
        body,
        data,
        type
      });
      await notification.save();

      // 2. Fetch Partner to get FCM Token
      const partner = await Partner.findById(partnerId);
      if (!partner || !partner.fcmToken) {
        console.log(`Partner ${partnerId} not found or has no FCM token. Notification saved to DB only.`);
        return { success: true, savedToDb: true, pushSent: false };
      }

      // 3. Send Push Notification via Firebase
      if (getApps().length > 0) {
        const message = {
          notification: {
            title,
            body
          },
          data: {
            ...data,
            type
          },
          token: partner.fcmToken
        };

        const response = await getMessaging().send(message);
        console.log('Successfully sent message to partner:', response);
        return { success: true, savedToDb: true, pushSent: true, response };
      }
      return { success: true, savedToDb: true, pushSent: false, reason: 'Firebase not initialized' };
    } catch (error) {
      console.error('Error sending notification to partner:', error);
      return { success: false, savedToDb: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();
