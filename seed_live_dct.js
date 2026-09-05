const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');

// Live DB URI from .env
const URI = 'mongodb+srv://digicodersdevelopment_db_user:KoJGvdKsGU9IQQvk@cluster0.9ssqshr.mongodb.net/e-BharatPrime?retryWrites=true&w=majority';

// DCT Partner's actual station ID from live API
const STATION_ID = '6a60916559c51f4623484fbe'; // "blue berry"
const PARTNER_ID = '6a51f5c1a7ee87fd119b2e7e'; // DCT / green@gmail.com

async function seedLive() {
  await mongoose.connect(URI);
  console.log("Connected to MongoDB");
  
  // Check bookings in this station to understand dates
  const existing = await Booking.find({ station: STATION_ID }).select('createdAt estimatedCost status');
  console.log("Existing bookings:", existing.map(b => ({ date: b.createdAt, cost: b.estimatedCost, status: b.status })));
  
  const today = new Date();
  console.log("Today is:", today.toISOString());
  
  // Add 5 today bookings directly
  for (let i = 0; i < 5; i++) {
    const bookingDate = new Date();
    bookingDate.setHours(8 + i, 0, 0, 0); // 8AM, 9AM, 10AM, 11AM, 12PM today
    
    const b = await Booking.create({
      bookingId: 'BKLIVE' + Date.now() + i,
      user: new mongoose.Types.ObjectId(),
      station: STATION_ID,
      connectorType: "CCS2",
      scheduledDate: today.toISOString().split('T')[0],
      scheduledTime: `${8 + i}:00 AM`,
      estimatedCost: 1000 + (i * 500), // 1000, 1500, 2000, 2500, 3000
      paymentMethod: "wallet",
      status: 'Completed',
    });
    // Force today's date - override mongoose timestamps
    await Booking.findByIdAndUpdate(b._id, { $set: { createdAt: bookingDate } });
    console.log(`Added booking: ₹${1000 + (i * 500)} at ${8 + i}:00 today`);
  }
  
  // Verify
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayBookings = await Booking.find({ station: STATION_ID, createdAt: { $gte: todayStart } });
  const revenue = todayBookings.reduce((s, b) => s + (b.estimatedCost || 0), 0);
  console.log(`\nVerification - Today's bookings: ${todayBookings.length}, Revenue: ₹${revenue}`);
  
  process.exit(0);
}

seedLive().catch(console.error);
