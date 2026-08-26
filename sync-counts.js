require('dotenv').config();
const mongoose = require('mongoose');
const Partner = require('./src/models/Partner');
const Station = require('./src/models/Station');

async function syncCounts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const partners = await Partner.find();
    for (const partner of partners) {
      const count = await Station.countDocuments({ partner: partner.name });
      partner.stationsCount = count;
      await partner.save();
      console.log(`Updated ${partner.name} - Stations: ${count}`);
    }

    console.log('All partner station counts synced!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

syncCounts();
