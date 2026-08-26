require('dotenv').config();
const mongoose = require('mongoose');
require('./src/config/firebase').initializeFirebase();
const notificationService = require('./src/services/notificationService');
const Partner = require('./src/models/Partner');

async function testNotifications() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    const User = require('./src/models/User');
    const Admin = require('./src/models/Admin');
    const Franchise = require('./src/models/Franchise');

    const users = await User.find({ email: 'sv575014@gmail.com' });
    const admins = await Admin.find({ email: 'sv575014@gmail.com' });
    const franchises = await Franchise.find({ email: 'sv575014@gmail.com' });

    console.log(`Found in Users: ${users.length}`);
    console.log(`Found in Admins: ${admins.length}`);
    console.log(`Found in Franchises: ${franchises.length}`);
    process.exit(0);

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
