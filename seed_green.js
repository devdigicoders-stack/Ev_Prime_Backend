const mongoose = require('mongoose');
const Station = require('./src/models/Station');
const Booking = require('./src/models/Booking');
const Partner = require('./src/models/Partner');

const URI = 'mongodb+srv://digicodersdevelopment_db_user:KoJGvdKsGU9IQQvk@cluster0.9ssqshr.mongodb.net/e-BharatPrime?retryWrites=true&w=majority';

async function seedForGreen() {
  await mongoose.connect(URI);
  console.log("Connected to MongoDB");
  
  // Find the partner with email green@gmail.com
  const partner = await Partner.findOne({ email: 'green@gmail.com' });
  if (!partner) {
    // Try by username
    const partnerByUser = await Partner.findOne({ appUsername: 'green@gmail.com' });
    console.log("By username:", partnerByUser);
    const allPartners = await Partner.find({}, 'name email appUsername phone');
    console.log("All partners:", JSON.stringify(allPartners, null, 2));
    process.exit(0);
  }
  
  console.log(`Found partner: ${partner.name} (${partner._id})`);
  
  // Find stations for this partner
  const stations = await Station.find({ partner: partner._id.toString() });
  console.log(`Stations for this partner: ${stations.length}`);
  
  if (stations.length === 0) {
    // Assign some stations to this partner
    const allStations = await Station.find().limit(5);
    for (let s of allStations) {
      s.partner = partner._id.toString();
      await s.save();
    }
    console.log(`Assigned 5 stations to partner ${partner.name}`);
    const updatedStations = await Station.find({ partner: partner._id.toString() });
    
    for (let station of updatedStations) {
      const today = new Date();
      const booking = new Booking({
        bookingId: 'BK' + Date.now() + Math.floor(Math.random()*9999),
        user: partner._id, // using partner as dummy user ref
        station: station._id,
        connectorType: "CCS2",
        scheduledDate: today.toISOString().split('T')[0],
        scheduledTime: "11:00 AM",
        estimatedCost: 2500,
        paymentMethod: "wallet",
        status: 'Completed',
        createdAt: today
      });
      await booking.save();
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const booking2 = new Booking({
        bookingId: 'BK' + Date.now() + Math.floor(Math.random()*9999),
        user: partner._id,
        station: station._id,
        connectorType: "CCS2",
        scheduledDate: yesterday.toISOString().split('T')[0],
        scheduledTime: "11:00 AM",
        estimatedCost: 1800,
        paymentMethod: "wallet",
        status: 'Completed',
        createdAt: yesterday
      });
      await booking2.save();
      console.log(`Added bookings for station ${station.name}`);
    }
  } else {
    for (let station of stations) {
      const today = new Date();
      const booking = new Booking({
        bookingId: 'BK' + Date.now() + Math.floor(Math.random()*9999),
        user: partner._id,
        station: station._id,
        connectorType: "CCS2",
        scheduledDate: today.toISOString().split('T')[0],
        scheduledTime: "11:00 AM",
        estimatedCost: 2500,
        paymentMethod: "wallet",
        status: 'Completed',
        createdAt: today
      });
      await booking.save();
      console.log(`Added booking for station ${station.name}`);
    }
  }
  
  console.log("Done! Now pull-to-refresh on the app.");
  process.exit(0);
}

seedForGreen().catch(console.error);
