require('dotenv').config();
const mongoose = require('mongoose');
const Partner = require('./src/models/Partner');
const Station = require('./src/models/Station');
const Booking = require('./src/models/Booking');
const PartnerPayout = require('./src/models/PartnerPayout');
const PartnerNotification = require('./src/models/PartnerNotification');
const User = require('./src/models/User');

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const partner = await Partner.findOne({ name: 'Technical' });
    if (!partner) {
      console.log('Partner Technical not found!');
      process.exit(1);
    }

    const now = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];
    const today = formatDate(now);
    const yesterday = formatDate(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000));
    const lastWeek = formatDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
    const lastMonth = formatDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));

    // 1. Seed Stations (8 Online, 2 Busy, 1 Offline)
    await Station.deleteMany({ partner: partner.name }); // Clear existing stations for this partner

    let stationDocs = [];
    // 8 Online
    for (let i = 1; i <= 8; i++) {
      stationDocs.push({ name: `CodersAdda Station ${i}`, location: 'Lucknow', city: 'Lucknow', connectors: 2, partner: partner.name, status: 'Active' });
    }
    // 2 Maintenance (Busy)
    for (let i = 9; i <= 10; i++) {
      stationDocs.push({ name: `CodersAdda Station ${i}`, location: 'Lucknow', city: 'Lucknow', connectors: 1, partner: partner.name, status: 'Maintenance' });
    }
    // 1 Offline
    stationDocs.push({ name: 'CodersAdda Station 11', location: 'Lucknow', city: 'Lucknow', connectors: 3, partner: partner.name, status: 'Offline' });
    
    const stations = await Station.insertMany(stationDocs);
    const mainStation = stations[0]; // Use the first station for bookings
    
    partner.stationsCount = 11;
    await partner.save();
    console.log('Inserted 11 Stations');

    // 2. Find Dummy User
    let user = await User.findOne({ email: 'dummy_new@evprime.com' });
    if (!user) user = await User.create({ name: 'Dummy User', email: 'dummy_new@evprime.com', mobile: '9988776655', password: 'password123' });

    // Clear old Bookings, Payouts, Notifications
    await Booking.deleteMany({ station: { $in: stations.map(s => s._id) } });
    await PartnerPayout.deleteMany({ partner: partner._id });
    await PartnerNotification.deleteMany({ partner: partner._id });

    // 3. Seed Active Sessions (4 Ongoing Bookings)
    const activeBookings = [
      { bookingId: 'BK_ACT1', user: user._id, station: stations[0]._id, connectorType: 'CCS2', scheduledDate: today, scheduledTime: '10:00 AM', estimatedCost: 150, paymentMethod: 'razorpay', paymentStatus: 'Paid', status: 'Ongoing', unitsConsumed: 12, duration: 18, chargeUpTo: 72 },
      { bookingId: 'BK_ACT2', user: user._id, station: stations[1]._id, connectorType: 'Type2', scheduledDate: today, scheduledTime: '10:15 AM', estimatedCost: 80, paymentMethod: 'wallet', paymentStatus: 'Paid', status: 'Ongoing', unitsConsumed: 5, duration: 12, chargeUpTo: 45 },
      { bookingId: 'BK_ACT3', user: user._id, station: stations[2]._id, connectorType: 'CCS2', scheduledDate: today, scheduledTime: '10:20 AM', estimatedCost: 200, paymentMethod: 'razorpay', paymentStatus: 'Paid', status: 'Ongoing', unitsConsumed: 20, duration: 25, chargeUpTo: 80 },
      { bookingId: 'BK_ACT4', user: user._id, station: stations[3]._id, connectorType: 'AC', scheduledDate: today, scheduledTime: '10:25 AM', estimatedCost: 50, paymentMethod: 'wallet', paymentStatus: 'Paid', status: 'Ongoing', unitsConsumed: 3, duration: 5, chargeUpTo: 20 }
    ];

    // Seed Completed Bookings (for Revenue Graph)
    const completedBookings = [
      { bookingId: 'BK_CMP1', user: user._id, station: mainStation._id, connectorType: 'CCS2', scheduledDate: today, scheduledTime: '08:00 AM', estimatedCost: 10480, paymentMethod: 'razorpay', paymentStatus: 'Paid', status: 'Completed' }, // Big amount to reach ~12K total for today
      { bookingId: 'BK_CMP2', user: user._id, station: mainStation._id, connectorType: 'Type2', scheduledDate: yesterday, scheduledTime: '09:00 AM', estimatedCost: 10000, paymentMethod: 'wallet', paymentStatus: 'Paid', status: 'Completed' },
      { bookingId: 'BK_CMP3', user: user._id, station: mainStation._id, connectorType: 'CCS2', scheduledDate: lastWeek, scheduledTime: '02:00 PM', estimatedCost: 45000, paymentMethod: 'razorpay', paymentStatus: 'Paid', status: 'Completed' },
      { bookingId: 'BK_CMP4', user: user._id, station: mainStation._id, connectorType: 'AC', scheduledDate: lastMonth, scheduledTime: '01:00 PM', estimatedCost: 120000, paymentMethod: 'razorpay', paymentStatus: 'Paid', status: 'Completed' }
    ];

    await Booking.insertMany([...activeBookings, ...completedBookings]);
    console.log('Inserted Active and Completed Bookings');

    // 4. Seed Payouts
    await PartnerPayout.insertMany([
      { partner: partner._id, amount: 8450, status: 'Completed', processedAt: yesterday },
      { partner: partner._id, amount: 1850, status: 'Completed', processedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) }, // 2 hours ago
      { partner: partner._id, amount: 5000, status: 'Pending', requestedAt: now }
    ]);
    console.log('Inserted Payouts');

    // 5. Seed Notifications (Intelligent & Recent Activity)
    await PartnerNotification.insertMany([
      { partner: partner._id, title: 'Station Offline 🔴', body: 'Station #04 has been offline for 18 minutes.', type: 'alert', createdAt: now },
      { partner: partner._id, title: 'Low Utilization ⚠️', body: 'Station #07 has received only 2 sessions today.', type: 'warning', createdAt: new Date(now.getTime() - 30 * 60000) },
      { partner: partner._id, title: 'Payout Processed 💰', body: '₹8,450 transferred to your bank account.', type: 'general', createdAt: new Date(now.getTime() - 60 * 60000) },
      { partner: partner._id, title: 'Maintenance Reminder 🔧', body: 'Station #02 maintenance is due tomorrow.', type: 'warning', createdAt: new Date(now.getTime() - 120 * 60000) },
      // Extra "Recent Activity" equivalents
      { partner: partner._id, title: 'Session Completed ⚡', body: 'Session completed — Station #04 — ₹240', type: 'general', createdAt: new Date(now.getTime() - 5 * 60000) },
      { partner: partner._id, title: 'Booking Received 🎟', body: 'Booking received — Station #02', type: 'general', createdAt: new Date(now.getTime() - 15 * 60000) },
      { partner: partner._id, title: 'Maintenance Completed 🔧', body: 'Maintenance completed — Station #06', type: 'general', createdAt: new Date(now.getTime() - 200 * 60000) }
    ]);
    console.log('Inserted Intelligent Notifications');

    console.log('ALL DASHBOARD DATA SEEDED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedData();
