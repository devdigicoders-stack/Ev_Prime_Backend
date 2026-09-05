const Booking = require('../models/Booking');
const Station = require('../models/Station');
const mongoose = require('mongoose');

// @desc    Get Carbon Dashboard Data (Admin)
// @route   GET /api/carbon
// @access  Admin
const getCarbonData = async (req, res) => {
  try {
    const range = req.query.range || 'all';
    let dateFilter = {};
    let trendDays = 90;

    if (range === 'custom' && req.query.from && req.query.to) {
      const fromDate = new Date(req.query.from);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(req.query.to);
      toDate.setHours(23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: fromDate, $lte: toDate } };
      // trendDays = diff in days between from and to
      trendDays = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
    } else if (range !== 'all') {
      const days = parseInt(range.replace('d', ''));
      trendDays = days;
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - days);
      dateFilter = { createdAt: { $gte: pastDate } };
    } else {
      trendDays = 90;
    }

    // 1. Aggregate carbon data from completed bookings
    // carbonSavedKg may be 0 in DB, so fallback to estimatedEnergy-based calculation
    // EV average: 1 kWh ≈ 0.7 kg CO2 saved vs petrol car
    //             1 kWh ≈ 0.09 liters fuel equivalent
    //             1 tree absorbs ≈ 21 kg CO2/year → 0.057 kg/day
    const agg = await Booking.aggregate([
      { $match: { status: { $in: ['Completed', 'Confirmed'] }, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalCarbonKg:  { $sum: { $cond: [{ $gt: ['$carbonSavedKg', 0] }, '$carbonSavedKg', { $multiply: ['$estimatedEnergy', 0.7] }] } },
          totalFuelLiters:{ $sum: { $cond: [{ $gt: ['$fuelSavedLiters', 0] }, '$fuelSavedLiters', { $multiply: ['$estimatedEnergy', 0.09] }] } },
          totalEnergyKwh: { $sum: { $ifNull: ['$estimatedEnergy', 0] } },
          totalTrees:     { $sum: { $cond: [{ $gt: ['$treesEquivalent', 0] }, '$treesEquivalent', { $divide: [{ $multiply: ['$estimatedEnergy', 0.7] }, 21] }] } },
        }
      }
    ]);

    const totals = agg[0] || { totalCarbonKg: 0, totalFuelLiters: 0, totalEnergyKwh: 0, totalTrees: 0 };

    const stats = {
      co2Saved:        (totals.totalCarbonKg / 1000).toFixed(2),
      co2AvoidedKg:    Math.round(totals.totalCarbonKg).toLocaleString(),
      treesEquivalent: Math.round(totals.totalTrees).toLocaleString(),
      fuelSaved:       Math.round(totals.totalFuelLiters).toLocaleString(),
      energyGenerated: Math.round(totals.totalEnergyKwh).toLocaleString(),
    };

    // 2. Trend data — daily CO2 for selected range
    const trendStart = new Date();
    trendStart.setDate(trendStart.getDate() - (trendDays - 1));
    trendStart.setHours(0, 0, 0, 0);

    const trendAgg = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['Completed', 'Confirmed'] },
          createdAt: { $gte: trendStart }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%d %b', date: '$createdAt' } },
          carbonKg: { $sum: { $cond: [{ $gt: ['$carbonSavedKg', 0] }, '$carbonSavedKg', { $multiply: ['$estimatedEnergy', 0.7] }] } }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Build a full daily array with 0 for missing days
    const trendMap = {};
    trendAgg.forEach(t => { trendMap[t._id] = Math.round(t.carbonKg); });

    const trendData = [];
    for (let i = trendDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      trendData.push({
        date: label,
        index: trendDays - 1 - i,
        value: trendMap[label] || 0
      });
    }

    // 3. City donut chart — carbon by city
    const cityAgg = await Booking.aggregate([
      { $match: { status: { $in: ['Completed', 'Confirmed'] }, ...dateFilter } },
      {
        $lookup: {
          from: 'stations',
          localField: 'station',
          foreignField: '_id',
          as: 'stationData'
        }
      },
      { $unwind: '$stationData' },
      {
        $group: {
          _id: '$stationData.city',
          carbonKg: { $sum: { $cond: [{ $gt: ['$carbonSavedKg', 0] }, '$carbonSavedKg', { $multiply: ['$estimatedEnergy', 0.7] }] } }
        }
      },
      { $sort: { carbonKg: -1 } }
    ]);

    const colors = ['#8CC63F', '#38BDF8', '#8B5CF6', '#F59E0B', '#EAB308', '#9CA3AF'];
    let cityData = [];

    if (cityAgg.length > 0) {
      const totalCarbon = cityAgg.reduce((acc, c) => acc + c.carbonKg, 0);
      let othersCarbon = 0;

      cityAgg.forEach((c, idx) => {
        if (!c._id) return;
        const pct = totalCarbon > 0 ? parseFloat(((c.carbonKg / totalCarbon) * 100).toFixed(1)) : 0;
        if (idx < 5) {
          cityData.push({ name: c._id, value: pct, color: colors[idx] });
        } else {
          othersCarbon += pct;
        }
      });

      if (othersCarbon > 0) {
        cityData.push({ name: 'Others', value: parseFloat(othersCarbon.toFixed(1)), color: colors[5] });
      }
    } else {
      cityData = [{ name: 'No Data', value: 100, color: '#9CA3AF' }];
    }

    res.json({ stats, trendData, cityData });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's personal carbon stats
// @route   GET /api/carbon/my
// @access  User
const getMyCarbonStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const agg = await Booking.aggregate([
      { $match: { user: userId, status: 'Completed' } },
      {
        $group: {
          _id: null,
          totalCarbonKg: { $sum: '$carbonSavedKg' },
          totalFuelLiters: { $sum: '$fuelSavedLiters' },
          totalEnergyKwh: { $sum: '$estimatedEnergy' },
          totalTrees: { $sum: '$treesEquivalent' },
          totalSessions: { $sum: 1 },
        }
      }
    ]);

    const data = agg[0] || { totalCarbonKg: 0, totalFuelLiters: 0, totalEnergyKwh: 0, totalTrees: 0, totalSessions: 0 };

    res.json({
      success: true,
      data: {
        carbonSavedKg: parseFloat(data.totalCarbonKg.toFixed(2)),
        fuelSavedLiters: parseFloat(data.totalFuelLiters.toFixed(2)),
        energyConsumedKwh: parseFloat(data.totalEnergyKwh.toFixed(2)),
        treesEquivalent: parseFloat(data.totalTrees.toFixed(2)),
        totalSessions: data.totalSessions,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCarbonData, getMyCarbonStats };
