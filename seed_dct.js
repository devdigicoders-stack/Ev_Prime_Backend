const mongoose = require('mongoose');
const Station = require('./src/models/Station');
const Booking = require('./src/models/Booking');

const URI = 'mongodb+srv://digicodersdevelopment_db_user:KoJGvdKsGU9IQQvk@cluster0.9ssqshr.mongodb.net/e-BharatPrime?retryWrites=true&w=majority';

const PARTNER_ID = '6a51f5c1a7ee87fd119b2e7e'; // DCT / Shiva / green@gmail.com

async function seedDCT() {
  await mongoose.connect(URI);
  console.log("Connected to MongoDB");

  // Find stations for this partner
  let stations = await Station.find({ partner: PARTNER_ID });
  console.log(`Found ${stations.length} stations for DCT partner.`);

  // If none, assign 3 stations
  if (stations.length === 0) {
    const allStations = await Station.find().limit(3);
    for (let s of allStations) {
      s.partner = PARTNER_ID;
      await s.save();
    }
    stations = await Station.find({ partner: PARTNER_ID });
    console.log(`Assigned ${stations.length} stations to DCT partner.`);
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (let station of stations) {
    // Multiple bookings today to show real revenue
    for (let i = 0; i < 3; i++) {
      await Booking.create({
        bookingId: 'BK' + Date.now() + Math.floor(Math.random() * 99999),
        user: new mongoose.Types.ObjectId(),
        station: station._id,
        connectorType: "CCS2",
        scheduledDate: today.toISOString().split('T')[0],
        scheduledTime: `${9 + i}:00 AM`,
        estimatedCost: [1200, 1800, 2500][i],
        paymentMethod: "wallet",
        status: 'Completed',
        createdAt: new Date(today.getTime() - i * 3600000)
      });
    }

    // Yesterday bookings
    for (let i = 0; i < 2; i++) {
      await Booking.create({
        bookingId: 'BK' + Date.now() + Math.floor(Math.random() * 99999),
        user: new mongoose.Types.ObjectId(),
        station: station._id,
        connectorType: "CCS2",
        scheduledDate: yesterday.toISOString().split('T')[0],
        scheduledTime: `${10 + i}:00 AM`,
        estimatedCost: [2000, 1500][i],
        paymentMethod: "wallet",
        status: 'Completed',
        createdAt: new Date(yesterday.getTime() - i * 3600000)
      });
    }
    console.log(`Added bookings for station: ${station.name}`);
  }

  // Verify
  const todayBookings = await Booking.find({ station: { $in: stations.map(s => s._id) } });
  const todayOnly = todayBookings.filter(b => new Date(b.createdAt) >= new Date(today.toISOString().split('T')[0]));
  const totalRevenue = todayOnly.reduce((sum, b) => sum + (b.estimatedCost || 0), 0);
  console.log(`\nVerification: Today's bookings = ${todayOnly.length}, Today's Revenue = ₹${totalRevenue}`);
  console.log("Done! Pull to refresh on the app now.");
  process.exit(0);
}

seedDCT().catch(console.error);
