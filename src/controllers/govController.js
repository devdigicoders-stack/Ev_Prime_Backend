const Station = require('../models/Station');
const Booking = require('../models/Booking');
const User    = require('../models/User');

const cityCoordinates = {
  'Delhi':     { lat: 28.6139, lng: 77.2090 },
  'Mumbai':    { lat: 19.0760, lng: 72.8777 },
  'Bengaluru': { lat: 12.9716, lng: 77.5946 },
  'Pune':      { lat: 18.5204, lng: 73.8567 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Chennai':   { lat: 13.0827, lng: 80.2707 },
  'Kolkata':   { lat: 22.5726, lng: 88.3639 },
  'Lucknow':   { lat: 26.8467, lng: 80.9462 }
};

// @desc    Get Government Dashboard Data
// @route   GET /api/gov?period=month|quarter|year
// @access  Admin
const getGovDashboardData = async (req, res) => {
  try {
    const period = req.query.period || 'month';

    // --- Date range based on period ---
    const now  = new Date();
    let startDate;
    if (period === 'quarter') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1); // Jan 1 this year
    } else {
      // This Month (default)
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    startDate.setHours(0, 0, 0, 0);

    // 1. Stats
    const totalStations = await Station.countDocuments();
    const stations      = await Station.find({});
    const uniqueCities  = new Set(stations.map(s => s.city).filter(Boolean));
    const activeStatesCount = Math.min(uniqueCities.size || 12, 28);
    const totalUsers    = await User.countDocuments();

    // Real revenue from Bookings (all time)
    const allRevenueAgg = await Booking.aggregate([
      { $match: { status: { $in: ['Completed', 'Confirmed'] } } },
      { $group: { _id: null, total: { $sum: '$estimatedCost' } } }
    ]);
    const totalRevenue = allRevenueAgg[0]?.total || 0;

    // Period revenue
    const periodRevenueAgg = await Booking.aggregate([
      { $match: { status: { $in: ['Completed', 'Confirmed'] }, createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$estimatedCost' } } }
    ]);
    const periodRevenue = periodRevenueAgg[0]?.total || 0;
    const govRevenue    = Math.floor(totalRevenue  * 0.05);
    const govPeriod     = Math.floor(periodRevenue * 0.05);

    const stats = {
      totalStations: totalStations,
      activeStates:  activeStatesCount,
      totalRevenue:  totalRevenue,
      govRevenue:    govRevenue,
      totalUsers:    totalUsers
    };

    // 2. Weekly Bar Chart — real data from DB for the current period
    // Split period into 5 equal slices
    const periodMs   = now - startDate;
    const sliceMs    = periodMs / 5;
    const weekLabels = period === 'year'
      ? ['Jan–Feb', 'Mar–Apr', 'May–Jun', 'Jul–Aug', 'Sep–Dec']
      : ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];

    const revenueDataPromises = Array.from({ length: 5 }, (_, i) => {
      const from = new Date(startDate.getTime() + i * sliceMs);
      const to   = new Date(startDate.getTime() + (i + 1) * sliceMs);
      return Booking.aggregate([
        { $match: { status: { $in: ['Completed', 'Confirmed'] }, createdAt: { $gte: from, $lt: to } } },
        { $group: { _id: null, total: { $sum: '$estimatedCost' } } }
      ]).then(r => ({
        name:  weekLabels[i],
        value: Math.floor((r[0]?.total || 0) * 0.05) // 5% GST
      }));
    });
    const revenueData = await Promise.all(revenueDataPromises);

    // 3. Map Markers
    const mapMarkers = stations.map(station => {
      let lat = station.latitude;
      let lng = station.longitude;
      if (!lat || !lng) {
        const cityCoords = cityCoordinates[station.city] || cityCoordinates['Delhi'];
        lat = cityCoords.lat + (Math.random() * 0.1 - 0.05);
        lng = cityCoords.lng + (Math.random() * 0.1 - 0.05);
      }
      return { id: station._id, name: station.name, city: station.city, status: station.status, lat, lng };
    });

    // 4. Compliances & Notifications
    const compliances = [
      { name: 'EV Policy Compliance',    value: 98 },
      { name: 'Renewable Energy Usage',  value: Math.floor(Math.random() * 11 + 85) },
      { name: 'Carbon Emission Norms',   value: 97 },
      { name: 'Safety Compliance',       value: 99 },
    ];

    const today = new Date();
    const fmt = (daysAgo) => {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const notifications = [
      { title: 'New EV Infrastructure Policy Released',          date: fmt(1)  },
      { title: 'Subsidy Scheme Updated for Commercial Stations', date: fmt(3)  },
      { title: 'State Environmental Norms Updated',             date: fmt(5)  },
      { title: 'Tax Benefits for Fleet Operators Expanded',      date: fmt(12) },
    ];

    res.json({ stats, revenueData, mapMarkers, compliances, notifications, period });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getGovDashboardData };
