const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Use production MONGO_URI from env
const PRODUCTION_MONGO_URI = process.env.MONGO_URI;

const connectorMasterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  subtitle: { type: String },
  powerKw: { type: Number, required: true },
  chargeType: { type: String, enum: ['AC', 'DC'], required: true },
  icon: { type: String, default: 'ev_station' }
}, { timestamps: true });

const ConnectorMaster = mongoose.model('ConnectorMaster', connectorMasterSchema);

const seedConnectors = async () => {
  try {
    await mongoose.connect(PRODUCTION_MONGO_URI);
    console.log('Connected to Production MongoDB:', mongoose.connection.host);

    await ConnectorMaster.deleteMany();
    console.log('Cleared existing connector types...');

    const initialConnectors = [
      { name: 'CCS2', subtitle: 'DC Fast • 120 kW', powerKw: 120, chargeType: 'DC', icon: 'ev_station' },
      { name: 'CHAdeMO', subtitle: 'DC Fast • 60 kW', powerKw: 60, chargeType: 'DC', icon: 'ev_station_outlined' },
      { name: 'GB/T', subtitle: 'DC Fast • 60 kW', powerKw: 60, chargeType: 'DC', icon: 'electric_car' },
      { name: 'AC Type 2', subtitle: 'AC Fast • 22 kW', powerKw: 22, chargeType: 'AC', icon: 'electrical_services' },
      { name: 'AC Type 1', subtitle: 'AC Fast • 7.4 kW', powerKw: 7.4, chargeType: 'AC', icon: 'electrical_services_outlined' }
    ];

    await ConnectorMaster.insertMany(initialConnectors);
    console.log('Successfully seeded 5 connector types to PRODUCTION database!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding:', error);
    process.exit(1);
  }
};

seedConnectors();
