require('dotenv').config();
const mongoose = require('mongoose');
const Station = require('./src/models/Station');
const Partner = require('./src/models/Partner');
const notificationService = require('./src/services/notificationService');

async function testOffline() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Find the station 'aliganj ' which belongs to 'Technical'
    const station = await Station.findOne({ name: 'aliganj ' });
    if (!station) {
      console.log('Station not found');
      process.exit(1);
    }

    // Set station to offline
    station.status = 'Offline';
    station.offlineNotificationSent = false;
    await station.save();
    console.log(`Station ${station.name} status set to Offline`);

    // Force run the cron job logic
    console.log('Simulating Cron Job Run...');
    const offlineStations = await Station.find({
      status: 'Offline',
      offlineNotificationSent: { $ne: true }
    });

    for (const st of offlineStations) {
      const diffMs = Date.now() - new Date(st.updatedAt).getTime();
      const mins = Math.floor(diffMs / 60000);

      const partnerDoc = await Partner.findOne({ name: st.partner });
      if (partnerDoc) {
        await notificationService.sendToPartner(
          partnerDoc._id.toString(),
          'Station Offline 🔴',
          `Station ${st.name} has been offline for ${mins} minutes.`,
          'alert'
        );
        console.log(`Notification sent for station ${st.name} to partner ${partnerDoc.name}`);
      }

      st.offlineNotificationSent = true;
      await st.save();
    }

    console.log('Test completed!');
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testOffline();
