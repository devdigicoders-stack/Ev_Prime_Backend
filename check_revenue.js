const mongoose = require('mongoose');
const Partner = require('./src/models/Partner');
const Station = require('./src/models/Station');
const Booking = require('./src/models/Booking');

const URI = 'mongodb+srv://digicodersdevelopment_db_user:KoJGvdKsGU9IQQvk@cluster0.9ssqshr.mongodb.net/e-BharatPrime?retryWrites=true&w=majority';

async function check() {
  await mongoose.connect(URI);
  console.log("Connected to MongoDB");
  
  const partners = await Partner.find();
  console.log(`Found ${partners.length} partners`);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let partner of partners) {
    let stationIds = [];
    if (partner.isSubPartner) {
        stationIds = partner.assignedStations || [];
    } else {
        const stations = await Station.find({ partner: partner._id }).select('_id');
        stationIds = stations.map(s => s._id);
    }
    
    if (stationIds.length > 0) {
        const stationFilter = { station: { $in: stationIds } };
        const allBookings = await Booking.find(stationFilter);
        const todayBookings = allBookings.filter(b => new Date(b.createdAt) >= today);
        const todayRevenue = todayBookings.reduce((sum, b) => sum + Number(b.estimatedCost || b.totalAmount || b.amount || 0), 0);
        
        console.log(`Partner: ${partner.name}, Stations: ${stationIds.length}, Bookings: ${allBookings.length}, Today Bookings: ${todayBookings.length}, Today Revenue: ₹${todayRevenue}`);
    } else {
        console.log(`Partner: ${partner.name}, No stations found.`);
    }
  }
  
  process.exit(0);
}

check().catch(console.error);
