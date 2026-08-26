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

    // Find Partner
    const partner = await Partner.findOne({ name: 'Technical' }); // CodersAdda
    if (!partner) {
      console.log('Partner Technical not found!');
      process.exit(1);
    }
    console.log(`Found Partner: ${partner.name} (${partner._id})`);

    // Find Station
    let station = await Station.findOne({ partner: partner.name });
    if (!station) {
      station = await Station.create({
        name: 'CodersAdda EV Hub',
        location: 'Kapoorthala',
        city: 'Lucknow',
        connectors: 2,
        partner: partner.name,
        status: 'Active'
      });
      console.log('Created dummy station');
    } else {
      console.log(`Found Station: ${station.name}`);
    }

    // Find or Create Dummy User
    let user = await User.findOne({ email: 'dummy_new@evprime.com' });
    if (!user) {
      user = await User.create({
        name: 'Dummy User',
        email: 'dummy_new@evprime.com',
        mobile: '9988776655',
        password: 'password123'
      });
      console.log('Created dummy user');
    }

    // Clear old test data for this partner to avoid massive duplicates on re-runs
    await Booking.deleteMany({ station: station._id });
    await PartnerPayout.deleteMany({ partner: partner._id });

    const now = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];
    const today = formatDate(now);
    const yesterday = formatDate(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000));
    const lastWeek = formatDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
    const lastMonth = formatDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));

    // Create Bookings covering all Statuses and Dates
    const bookingsData = [
      { bookingId: 'BK' + Date.now() + '1', user: user._id, station: station._id, connectorType: 'CCS2', scheduledDate: today, scheduledTime: '10:00 AM', estimatedCost: 450, paymentMethod: 'razorpay', paymentStatus: 'Paid', status: 'Completed', unitsConsumed: 25, duration: 45 },
      { bookingId: 'BK' + Date.now() + '2', user: user._id, station: station._id, connectorType: 'Type2', scheduledDate: yesterday, scheduledTime: '11:30 AM', estimatedCost: 320, paymentMethod: 'wallet', paymentStatus: 'Paid', status: 'Completed', unitsConsumed: 18, duration: 30 },
      { bookingId: 'BK' + Date.now() + '3', user: user._id, station: station._id, connectorType: 'CCS2', scheduledDate: lastWeek, scheduledTime: '02:00 PM', estimatedCost: 500, paymentMethod: 'razorpay', paymentStatus: 'Paid', status: 'Ongoing', unitsConsumed: 10, duration: 20 },
      { bookingId: 'BK' + Date.now() + '4', user: user._id, station: station._id, connectorType: 'AC', scheduledDate: today, scheduledTime: '09:00 AM', estimatedCost: 150, paymentMethod: 'wallet', paymentStatus: 'Pending', status: 'Confirmed' },
      { bookingId: 'BK' + Date.now() + '5', user: user._id, station: station._id, connectorType: 'CCS2', scheduledDate: lastMonth, scheduledTime: '01:00 PM', estimatedCost: 200, paymentMethod: 'razorpay', paymentStatus: 'Failed', status: 'Cancelled', cancellationReason: 'User did not arrive' },
      { bookingId: 'BK' + Date.now() + '6', user: user._id, station: station._id, connectorType: 'Type2', scheduledDate: today, scheduledTime: '12:00 PM', estimatedCost: 300, paymentMethod: 'wallet', paymentStatus: 'Paid', status: 'Charging', unitsConsumed: 5, duration: 10 },
      { bookingId: 'BK' + Date.now() + '7', user: user._id, station: station._id, connectorType: 'AC', scheduledDate: yesterday, scheduledTime: '04:00 PM', estimatedCost: 100, paymentMethod: 'wallet', paymentStatus: 'Paid', status: 'No Show' }
    ];
    await Booking.insertMany(bookingsData);
    console.log(`Inserted ${bookingsData.length} bookings covering all statuses and dates`);

    // Create Payouts covering all statuses
    const payoutsData = [
      { partner: partner._id, amount: 8500, status: 'Completed', processedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
      { partner: partner._id, amount: 3200, status: 'Pending', requestedAt: now },
      { partner: partner._id, amount: 1500, status: 'Rejected', remarks: 'Invalid bank details', requestedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) }
    ];
    await PartnerPayout.insertMany(payoutsData);
    console.log(`Inserted ${payoutsData.length} payouts covering all statuses`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedData();
