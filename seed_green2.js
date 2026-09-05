const mongoose = require('mongoose');
const Station = require('./src/models/Station');
const Booking = require('./src/models/Booking');
const Partner = require('./src/models/Partner');

const URI = 'mongodb+srv://digicodersdevelopment_db_user:KoJGvdKsGU9IQQvk@cluster0.9ssqshr.mongodb.net/e-BharatPrime?retryWrites=true&w=majority';

async function seedGreen() {
  await mongoose.connect(URI);
  console.log("Connected to MongoDB");
  
  // Find by appUsername or email
  let partner = await Partner.findOne({ appUsername: 'green@gmail.com' });
  if (!partner) partner = await Partner.findOne({ email: 'sv575014@gmail.com' });
  if (!partner) {
    // Search broadly
    const all = await Partner.find({}, 'name email appUsername phone');
    console.log("All partners:", JSON.stringify(all, null, 2));
    process.exit(0);
  }
  
  console.log(`Found partner: ${partner.name} (${partner._id})`);
  
  // Find stations for this partner
  let stations = await Station.find({ partner: partner._id.toString() });
  console.log(`Found ${stations.length} stations for this partner.`);
  
  // If no stations, assign some
  if (stations.length === 0) {
    const allStations = await Station.find().limit(3);
    for (let s of allStations) {
      s.partner = partner._id.toString();
      await s.save();
    }
    stations = await Station.find({ partner: partner._id.toString() });
    console.log(`Assigned ${stations.length} stations to partner.`);
  }
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  for (let station of stations) {
    // Today's booking
    await Booking.create({
      bookingId: 'BK' + Date.now() + Math.floor(Math.random()*9999),
      user: partner._id,
      station: station._id,
      connectorType: "CCS2",
      scheduledDate: today.toISOString().split('T')[0],
      scheduledTime: "10:00 AM",
      estimatedCost: 3500,
      paymentMethod: "wallet",
      status: 'Completed',
      createdAt: today
    });
    // Yesterday's booking
    await Booking.create({
      bookingId: 'BK' + Date.now() + Math.floor(Math.random()*9999),
      user: partner._id,
      station: station._id,
      connectorType: "CCS2",
      scheduledDate: yesterday.toISOString().split('T')[0],
      scheduledTime: "10:00 AM",
      estimatedCost: 2000,
      paymentMethod: "wallet",
      status: 'Completed',
      createdAt: yesterday
    });
    console.log(`Added bookings for station: ${station.name}`);
  }
  
  console.log("Done! Pull to refresh on app now.");
  process.exit(0);
}

seedGreen().catch(console.error);
