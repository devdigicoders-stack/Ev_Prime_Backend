require('dotenv').config();
const mongoose = require('mongoose');
const Partner = require('./src/models/Partner');
const Station = require('./src/models/Station');

async function seedStations() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Find Partner
    const partner = await Partner.findOne({ name: 'Technical' }); // CodersAdda
    if (!partner) {
      console.log('Partner Technical not found!');
      process.exit(1);
    }

    // 1. Online (Active)
    let activeStation = await Station.findOne({ name: 'CodersAdda Hub - Online' });
    if (!activeStation) {
      await Station.create({
        name: 'CodersAdda Hub - Online',
        location: 'Hazratganj',
        city: 'Lucknow',
        connectors: 2,
        partner: partner.name,
        status: 'Active'
      });
      console.log('Created Active (Online) station');
    }

    // 2. Offline
    let offlineStation = await Station.findOne({ name: 'CodersAdda Hub - Offline' });
    if (!offlineStation) {
      await Station.create({
        name: 'CodersAdda Hub - Offline',
        location: 'Gomti Nagar',
        city: 'Lucknow',
        connectors: 3,
        partner: partner.name,
        status: 'Offline'
      });
      console.log('Created Offline station');
    }

    // 3. Busy (Maintenance)
    let busyStation = await Station.findOne({ name: 'CodersAdda Hub - Busy' });
    if (!busyStation) {
      await Station.create({
        name: 'CodersAdda Hub - Busy',
        location: 'Alambagh',
        city: 'Lucknow',
        connectors: 1,
        partner: partner.name,
        status: 'Maintenance'
      });
      console.log('Created Maintenance (Busy) station');
    }

    // Update partner stationsCount
    const count = await Station.countDocuments({ partner: partner.name });
    partner.stationsCount = count;
    await partner.save();
    console.log(`Updated Partner stationsCount to ${count}`);

    console.log('Seeding stations completed!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedStations();
