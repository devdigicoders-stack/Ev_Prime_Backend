require('dotenv').config();
const mongoose = require('mongoose');
require('./src/config/firebase').initializeFirebase();
const notificationService = require('./src/services/notificationService');
const Partner = require('./src/models/Partner');

async function testNotifications() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find the first partner in the database
    const partner = await Partner.findOne();
    
    if (!partner) {
      console.log('No partners found in the database. Cannot send test notifications.');
      process.exit(1);
    }

    const partnerId = partner._id.toString();
    console.log(`Sending notifications to Partner: ${partner.name || partner.phone} (${partnerId})`);

    // 1. Station Offline
    await notificationService.sendToPartner(
      partnerId,
      'Station Offline 🔴',
      'Station Sector 4 has been offline for 18 minutes.',
      'alert'
    );
    console.log('Sent: Station Offline');

    // 2. Low Utilization
    await notificationService.sendToPartner(
      partnerId,
      'Low Utilization ⚠️',
      'Station City Center has received only 2 sessions today.',
      'warning'
    );
    console.log('Sent: Low Utilization');

    // 3. Maintenance Reminder
    await notificationService.sendToPartner(
      partnerId,
      'Maintenance Reminder 🔧',
      'Station Highway Point maintenance is due tomorrow.',
      'warning'
    );
    console.log('Sent: Maintenance Reminder');

    // 4. Payout Processed
    await notificationService.sendToPartner(
      partnerId,
      'Payout Processed',
      '₹8,450 transferred to your bank account.',
      'payout'
    );
    console.log('Sent: Payout Processed');

    console.log('All test notifications sent successfully!');
    process.exit(0);

  } catch (err) {
    console.error('Error during testing:', err);
    process.exit(1);
  }
}

testNotifications();
