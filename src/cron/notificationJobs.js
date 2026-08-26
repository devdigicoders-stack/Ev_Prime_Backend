const cron = require('node-cron');
const Station = require('../models/Station');
const Booking = require('../models/Booking');
const notificationService = require('../services/notificationService');

const initCronJobs = () => {
  // 1. Station Offline Check (Runs every 10 minutes)
  //   Looks for stations that have been offline for at least 15 mins.
  //   Since timestamps:true updates 'updatedAt' on any change,
  //   if it's offline and updatedAt < 15 mins ago, we send an alert.
  cron.schedule('*/10 * * * *', async () => {
    try {
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      const offlineStations = await Station.find({
        status: 'Offline',
        updatedAt: { $lte: fifteenMinsAgo },
        offlineNotificationSent: { $ne: true }
      });

      for (const station of offlineStations) {
        // Find how many minutes exactly it's been offline
        const diffMs = Date.now() - new Date(station.updatedAt).getTime();
        const mins = Math.floor(diffMs / 60000);

        await notificationService.sendPartnerNotification(
          station.partner.toString(),
          'Station Offline 🔴',
          `Station ${station.name} has been offline for ${mins} minutes.`,
          'alert'
        );

        station.offlineNotificationSent = true;
        await station.save();
      }
    } catch (err) {
      console.error('Error in Station Offline Cron Job:', err);
    }
  });

  // 1b. Reset Offline Flag (Runs every 15 minutes)
  cron.schedule('*/15 * * * *', async () => {
    try {
      await Station.updateMany(
        { status: { $ne: 'Offline' }, offlineNotificationSent: true },
        { $set: { offlineNotificationSent: false } }
      );
    } catch (err) {
      console.error('Error in Reset Offline Flag Cron Job:', err);
    }
  });

  // 2. Low Utilization (Runs daily at 23:50)
  cron.schedule('50 23 * * *', async () => {
    try {
      const activeStations = await Station.find({ status: 'Active' });
      
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      for (const station of activeStations) {
        const sessionCount = await Booking.countDocuments({
          station: station._id,
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        if (sessionCount <= 2) {
          await notificationService.sendPartnerNotification(
            station.partner.toString(),
            'Low Utilization ⚠️',
            `Station ${station.name} has received only ${sessionCount} sessions today.`,
            'warning'
          );
        }
      }
    } catch (err) {
      console.error('Error in Low Utilization Cron Job:', err);
    }
  });

  // 3. Maintenance Reminder (Runs daily at 08:00 AM)
  cron.schedule('0 8 * * *', async () => {
    try {
      const tomorrowStart = new Date();
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      tomorrowStart.setHours(0, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrowStart);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const stationsDue = await Station.find({
        maintenanceDate: { $gte: tomorrowStart, $lte: tomorrowEnd }
      });

      for (const station of stationsDue) {
        await notificationService.sendPartnerNotification(
          station.partner.toString(),
          'Maintenance Reminder 🔧',
          `Station ${station.name} maintenance is due tomorrow.`,
          'warning'
        );
      }
    } catch (err) {
      console.error('Error in Maintenance Reminder Cron Job:', err);
    }
  });

  console.log('Intelligent Notification Cron Jobs initialized.');
};

module.exports = initCronJobs;
