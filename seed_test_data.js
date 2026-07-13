require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Partner = require('./src/models/Partner');
const Station = require('./src/models/Station');
const Booking = require('./src/models/Booking');

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Create User
    let user = await User.findOne({ mobile: '9999999999' });
    if (!user) {
      user = await User.create({ name: 'Test Customer', mobile: '9999999999', email: 'test@customer.com', active: true });
      console.log('Created User');
    }

    // 2. Find existing Partner
    let partner = await Partner.findOne({});
    if (!partner) {
      partner = await Partner.create({ name: 'Test Partner', email: 'test@partner.com', phone: '8888888888', appPassword: '123456', type: 'Fleet', status: 'Active' });
      console.log('Created Partner');
    }

    // 3. Create Station
    let station = await Station.findOne({ partner: partner.name });
    if (!station) {
      station = await Station.create({
        name: 'Prime Plaza Charging',
        partner: partner.name,
        location: 'Connaught Place',
        city: 'New Delhi',
        status: 'Active',
        connectors: 2,
        connectorTypes: [{ type: 'CCS2', powerKw: 60, pricePerUnit: 18 }, { type: 'AC Type 2', powerKw: 7.2, pricePerUnit: 15 }]
      });
      console.log('Created Station');
    }

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 4. Create Bookings
    const b1 = await Booking.create({
      bookingId: 'B' + Date.now() + '1',
      user: user._id,
      station: station._id,
      connectorType: 'AC Type 2',
      connectorPower: '7.2',
      scheduledDate: yesterday.toISOString().split('T')[0],
      scheduledTime: '10:00',
      estimatedCost: 350,
      estimatedEnergy: 20,
      status: 'Completed',
      paymentStatus: 'Paid',
      paymentMethod: 'wallet',
      createdAt: yesterday
    });
    
    const b2 = await Booking.create({
      bookingId: 'B' + Date.now() + '2',
      user: user._id,
      station: station._id,
      connectorType: 'CCS2',
      connectorPower: '60',
      scheduledDate: now.toISOString().split('T')[0],
      scheduledTime: '14:00',
      estimatedCost: 800,
      estimatedEnergy: 40,
      status: 'Completed',
      paymentStatus: 'Paid',
      paymentMethod: 'wallet',
      createdAt: now
    });
    
    const b3 = await Booking.create({
      bookingId: 'B' + Date.now() + '3',
      user: user._id,
      station: station._id,
      connectorType: 'CCS2',
      connectorPower: '60',
      scheduledDate: now.toISOString().split('T')[0],
      scheduledTime: '16:00',
      estimatedCost: 200,
      estimatedEnergy: 10,
      status: 'Confirmed',
      paymentStatus: 'Paid',
      paymentMethod: 'wallet',
      createdAt: now
    });
    
    const b4 = await Booking.create({
      bookingId: 'B' + Date.now() + '4',
      user: user._id,
      station: station._id,
      connectorType: 'AC Type 2',
      connectorPower: '7.2',
      scheduledDate: tomorrow.toISOString().split('T')[0],
      scheduledTime: '09:00',
      estimatedCost: 400,
      estimatedEnergy: 25,
      status: 'Cancelled',
      paymentStatus: 'Pending',
      paymentMethod: 'wallet',
      createdAt: now
    });
    
    console.log('Created 4 Test Bookings. Partner Phone:', partner.phone);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seedData();
