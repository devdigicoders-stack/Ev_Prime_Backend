require('dotenv').config({ path: './src/../.env' });
const mongoose = require('mongoose');
const B = mongoose.model('B3', new mongoose.Schema({}, { strict: false }), 'bookings');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const r = await B.find({ partner: 'DCT', bookingId: { $not: /^BK-TEST-/ } });
  console.log('Non-test DCT bookings:', r.length);
  r.forEach(b => console.log(
    '  station:', JSON.stringify(b.station),
    '| amount:', b.estimatedCost || b.totalAmount || b.amount,
    '| date:', b.createdAt
  ));
  mongoose.disconnect();
});
