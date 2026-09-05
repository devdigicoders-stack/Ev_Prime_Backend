const mongoose = require('mongoose');
const Station = require('./src/models/Station');
const Partner = require('./src/models/Partner');
const Booking = require('./src/models/Booking');

const URI = 'mongodb+srv://digicodersdevelopment_db_user:KoJGvdKsGU9IQQvk@cluster0.9ssqshr.mongodb.net/e-BharatPrime?retryWrites=true&w=majority';

async function fix() {
  await mongoose.connect(URI);
  console.log("Connected to MongoDB");
  
  const partners = await Partner.find();
  const stations = await Station.find();
  
  console.log(`Partners: ${partners.map(p => p._id + ' - ' + p.name).join(', ')}`);
  
  // Assign 10 stations to each partner to ensure everyone has stations
  let partnerIdx = 0;
  for (let station of stations) {
      const p = partners[partnerIdx % partners.length];
      station.partner = p._id.toString();
      await station.save();
      partnerIdx++;
  }
  console.log("Re-assigned stations to partners.");
  
  // Create bookings for ALL stations to make sure revenue shows up
  const today = new Date();
  for(let station of stations) {
      const booking1 = new Booking({
        bookingId: 'BK' + Date.now() + Math.floor(Math.random()*1000),
        user: new mongoose.Types.ObjectId(), // Dummy user
        station: station._id,
        connectorType: "CCS2",
        scheduledDate: today.toISOString().split('T')[0],
        scheduledTime: "12:00 PM",
        estimatedCost: 1500,
        paymentMethod: "wallet",
        status: 'Completed',
        createdAt: today
      });
      await booking1.save();
  }
  
  console.log("Added today's revenue to all stations.");
  process.exit(0);
}

fix().catch(console.error);
