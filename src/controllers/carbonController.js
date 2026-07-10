const Booking = require('../models/Booking');
const Station = require('../models/Station');
const mongoose = require('mongoose');

// @desc    Get Carbon Dashboard Data (Admin)
// @route   GET /api/carbon
// @access  Admin
const getCarbonData = async (req, res) => {
  try {
    const range = req.query.range || '30d';
    let dateFilter = {};

    if (range !== 'all') {
      const days = parseInt(range.replace('d', ''));
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - days);
      dateFilter = { createdAt: { $gte: pastDate } };
    }

    // 1. Aggregate real carbon data from completed bookings
    const agg = await Booking.aggregate([
      { $match: { status: 'Completed', ...dateFilter } },
      {
        $group: {
          _id: null,
          totalCarbonKg: { $sum: '$carbonSavedKg' },
          totalFuelLiters: { $sum: '$fuelSavedLiters' },
          totalEnergyKwh: { $sum: '$estimatedEnergy' },
          totalTrees: { $sum: '$treesEquivalent' },
        }
      }
    ]);

    const totals = agg[0] || { totalCarbonKg: 0, totalFuelLiters: 0, totalEnergyKwh: 0, totalTrees: 0 };

    const stats = {
      co2Saved: (totals.totalCarbonKg / 1000).toFixed(2),         // Tons
      co2AvoidedKg: Math.round(totals.totalCarbonKg).toLocaleString(),
      treesEquivalent: Math.round(totals.totalTrees).toLocaleString(),
      fuelSaved: Math.round(totals.totalFuelLiters).toLocaleString(),
      energyGenerated: Math.round(totals.totalEnergyKwh).toLocaleString(),
    };

    // 2. Trend data — daily CO2 saved for last 15 days
    const trendAgg = await Booking.aggregate([
      {
        $match: {
          status: 'Completed',
          createdAt: { $gte: (() => { const d = new Date(); d.setDate(d.getDate() - 15); return d; })() }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%d %b', date: '$createdAt' } },
          value: { $sum: '$carbonSavedKg' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const trendData = trendAgg.map(t => ({ name: t._id, value: Math.round(t.value) }));

    // 3. City donut chart — carbon by city
    const cityAgg = await Booking.aggregate([
      { $match: { status: 'Completed', ...dateFilter } },
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
          carbonKg: { $sum: '$carbonSavedKg' }
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
      // Fallback if no completed bookings yet
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
