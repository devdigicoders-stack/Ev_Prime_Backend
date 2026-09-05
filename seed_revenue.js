const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const Station = require('./src/models/Station');

async function seed() {
  try {
    await mongoose.connect('mongodb+srv://digicodersdevelopment_db_user:KoJGvdKsGU9IQQvk@cluster0.9ssqshr.mongodb.net/e-BharatPrime?retryWrites=true&w=majority');
    console.log("Connected to MongoDB");
    
    const stations = await Station.find();
    console.log(`Found ${stations.length} stations`);
    
    const users = await mongoose.connection.db.collection('users').find().toArray();
    const userId = users.length > 0 ? users[0]._id : new mongoose.Types.ObjectId();
    
    const today = new Date();
    
    for(let station of stations) {
      const booking1 = new Booking({
        bookingId: 'BK' + Date.now() + Math.floor(Math.random()*1000),
        user: userId,
        station: station._id,
        connectorType: "CCS2",
        scheduledDate: today.toISOString().split('T')[0],
        scheduledTime: "12:00 PM",
        estimatedCost: 1500, // ₹1500
        paymentMethod: "wallet",
        status: 'Completed',
        createdAt: today
      });
      await booking1.save();
      console.log(`Added today booking to station ${station.name}`);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const booking2 = new Booking({
        bookingId: 'BK' + Date.now() + Math.floor(Math.random()*1000),
        user: userId,
        station: station._id,
        connectorType: "CCS2",
        scheduledDate: yesterday.toISOString().split('T')[0],
        scheduledTime: "12:00 PM",
        estimatedCost: 1000, // ₹1000
        paymentMethod: "wallet",
        status: 'Completed',
        createdAt: yesterday
      });
      await booking2.save();
      console.log(`Added yesterday booking to station ${station.name}`);
    }
    
    console.log("Seeding done!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
