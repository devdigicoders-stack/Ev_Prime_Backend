require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const Station = require('./src/models/Station');

async function testAgg() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const bookingStats = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['Completed', 'Confirmed'] },
          paymentStatus: 'Paid'
        }
      },
      {
        $facet: {
          currentPeriod: [
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: {
                _id: null,
                totalRevenue: { $sum: "$estimatedCost" },
                totalEnergy: { $sum: "$estimatedEnergy" },
                totalSessions: { $sum: 1 }
            }}
          ],
          previousPeriod: [
            { $match: { createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
            { $group: {
                _id: null,
                totalRevenue: { $sum: "$estimatedCost" },
                totalEnergy: { $sum: "$estimatedEnergy" },
                totalSessions: { $sum: 1 }
            }}
          ]
        }
      }
    ]);

    console.log('Booking Stats:', JSON.stringify(bookingStats, null, 2));

    const topCities = await Booking.aggregate([
      {
        $match: { status: { $in: ['Completed', 'Confirmed'] }, paymentStatus: 'Paid' }
      },
      {
        $lookup: {
          from: 'stations',
          localField: 'station',
          foreignField: '_id',
          as: 'stationDetails'
        }
      },
      { $unwind: "$stationDetails" },
      {
        $group: {
          _id: "$stationDetails.city",
          revenue: { $sum: "$estimatedCost" },
          count: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);
    console.log('Top Cities:', JSON.stringify(topCities, null, 2));

    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

testAgg();
