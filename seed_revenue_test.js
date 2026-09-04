require('dotenv').config({ path: './src/../.env' });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
const STATION_ID = '6a60916559c51f4623484fbe';
const PARTNER_NAME = 'DCT';

const bookingSchema = new mongoose.Schema({}, { strict: false });
const Booking = mongoose.model('Booking', bookingSchema, 'bookings');

const connectorTypes = ['CCS2', 'CHAdeMO', 'AC Type 2', 'AC Type 1', 'GB/T'];
const statuses = ['Completed', 'Completed', 'Completed', 'Completed', 'Cancelled'];
const users = ['user001', 'user002', 'user003', 'user004', 'user005'];

async function seedRevenue() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const today = new Date();
  today.setHours(23, 59, 59, 0);

  let inserted = 0;

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);

    // 2-5 bookings per day
    const bookingsPerDay = Math.floor(Math.random() * 4) + 2;

    for (let b = 0; b < bookingsPerDay; b++) {
      const hour = 8 + Math.floor(Math.random() * 12);
      const bookingDate = new Date(date);
      bookingDate.setHours(hour, Math.floor(Math.random() * 60), 0, 0);

      const connector = connectorTypes[Math.floor(Math.random() * connectorTypes.length)];
      const isAC = connector.includes('AC');
      const units = (Math.random() * 20 + 5).toFixed(2);
      const pricePerUnit = isAC ? 20 : 30;
      const amount = Math.round(units * pricePerUnit);
      const status = dayOffset === 0 ? 'Charging' : statuses[Math.floor(Math.random() * statuses.length)];

      await Booking.create({
        bookingId: `BK-TEST-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        station: STATION_ID,
        stationName: 'blue berry',
        partner: PARTNER_NAME,
        user: users[Math.floor(Math.random() * users.length)],
        connectorType: connector,
        status,
        estimatedCost: amount,
        totalAmount: amount,
        amount,
        unitsConsumed: parseFloat(units),
        duration: Math.floor(units * 3),
        createdAt: bookingDate,
        updatedAt: bookingDate,
        paymentStatus: status === 'Completed' ? 'Paid' : 'Pending',
      });

      inserted++;
      const dayStr = bookingDate.toDateString();
      console.log(`  📅 ${dayStr} | ${connector} | ₹${amount} | ${status}`);
    }
  }

  console.log(`\n✅ Inserted ${inserted} test bookings for last 7 days!`);
  await mongoose.disconnect();
}

seedRevenue().catch(console.error);
