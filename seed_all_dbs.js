const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const Station = require('./src/models/Station');

const uris = [
  'mongodb+srv://digicodersdevelopment_db_user:KoJGvdKsGU9IQQvk@cluster0.9ssqshr.mongodb.net/e-BharatPrime?retryWrites=true&w=majority',
  'mongodb+srv://dharamchand10x:uRTYeE41C1Zc1lD5@cluster0.p0kik.mongodb.net/Bharat_Ev?retryWrites=true&w=majority',
  'mongodb+srv://developer:developer@cluster0.o5hzh.mongodb.net/ev-prime?retryWrites=true&w=majority'
];

async function seed() {
  for (const uri of uris) {
    try {
      console.log('Connecting to', uri);
      await mongoose.connect(uri);
      console.log("Connected to MongoDB:", uri);
      
      const stations = await Station.find();
      console.log(`Found ${stations.length} stations`);
      
      if(stations.length === 0) {
        await mongoose.disconnect();
        continue;
      }
      
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
      
      await mongoose.disconnect();
    } catch (err) {
      console.error(err);
    }
  }
  console.log("Seeding done for all databases!");
  process.exit(0);
}

seed();
