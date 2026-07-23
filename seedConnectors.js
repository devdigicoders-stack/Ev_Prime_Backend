const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ConnectorMaster = require('./src/models/ConnectorMaster');
const connectDB = require('./src/config/db');

dotenv.config();

const seedConnectors = async () => {
  try {
    await connectDB();
    
    // Clear existing connectors
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
    console.log('Successfully seeded 5 initial connector types!');
    process.exit();
  } catch (error) {
    console.error('Error seeding connectors:', error);
    process.exit(1);
  }
};

seedConnectors();
