require('dotenv').config();
const mongoose = require('mongoose');
const Station = require('./src/models/Station');

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const partnerName = 'Technical'; // CodersAdda's partner name in DB

    const newStations = [
      {
        name: 'Tech Park Fast Chargers',
        location: 'Cyberabad',
        city: 'Hyderabad',
        connectors: 10,
        partner: partnerName,
        status: 'Active'
      },
      {
        name: 'Mall Parking Station',
        location: 'Forum Mall',
        city: 'Bengaluru',
        connectors: 4,
        partner: partnerName,
        status: 'Offline'
      },
      {
        name: 'Highway Pitstop',
        location: 'NH44',
        city: 'Pune',
        connectors: 2,
        partner: partnerName,
        status: 'Maintenance'
      }
    ];

    for (const stData of newStations) {
      let st = await Station.findOne({ name: stData.name });
      if (!st) {
        await Station.create(stData);
        console.log(`Created station: ${stData.name} (${stData.status})`);
      } else {
        st.status = stData.status;
        st.connectors = stData.connectors;
        await st.save();
        console.log(`Updated station: ${stData.name} to ${stData.status}`);
      }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedData();
