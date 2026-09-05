const User = require('../models/User');
const Station = require('../models/Station');
const Partner = require('../models/Partner');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const Booking = require('../models/Booking');
const MarketOrder = require('../models/MarketOrder');

// Helper to calculate percentage growth
const calculateGrowth = (current, previous) => {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const diff = current - previous;
  const percentage = (diff / previous) * 100;
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(1)}%`;
};

// @desc    Get dashboard analytics
// @route   GET /api/dashboard
// @access  Private (Admin)
const getDashboardData = async (req, res) => {
  try {
    const now = new Date();
    const revenueDays = parseInt(req.query.revenueDays) || 14;
    const energyDays  = parseInt(req.query.energyDays)  || 30;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);

    let stationQuery = {};
    let partnerQuery = {};
    let bookingMatch = { status: { $in: ['Completed', 'Confirmed', 'Ongoing'] } };
    let bookingPaidMatch = { status: { $in: ['Completed', 'Confirmed'] }, paymentStatus: 'Paid' };

    if (req.admin && req.admin.adminType === 'subadmin') {
      stationQuery.createdBy = req.admin._id;
      partnerQuery.createdBy = req.admin._id;
      
      const subadminStations = await Station.find({ createdBy: req.admin._id }).select('_id');
      const subadminStationIds = subadminStations.map(s => s._id);
      bookingMatch.station = { $in: subadminStationIds };
      bookingPaidMatch.station = { $in: subadminStationIds };
    }

    // 1. Basic Stats (Users, Stations, Partners) with Growth
    const [
      totalUsers, prevUsers,
      totalStations, prevStations,
      totalPartners, prevPartners
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $lt: thirtyDaysAgo } }),
      Station.countDocuments(stationQuery),
      Station.countDocuments({ ...stationQuery, createdAt: { $lt: thirtyDaysAgo } }),
      Partner.countDocuments(partnerQuery),
      Partner.countDocuments({ ...partnerQuery, createdAt: { $lt: thirtyDaysAgo } })
    ]);

    const usersGrowth = calculateGrowth(totalUsers, prevUsers);
    const stationsGrowth = calculateGrowth(totalStations, prevStations);
    const partnersGrowth = calculateGrowth(totalPartners, prevPartners);

    // Active & Offline Stations
    const activeStations = await Station.countDocuments({ ...stationQuery, status: 'Active' });
    const offlineStations = totalStations - activeStations;

    // Map Data
    const mapData = await Station.find(stationQuery, 'name location city latitude longitude status connectorTypes.type');

    // 2. Booking Stats (Revenue, Sessions, Energy) with Growth
    const bookingStats = await Booking.aggregate([
      {
        $match: bookingMatch
      },
      {
        $facet: {
          currentPeriod: [
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: {
                _id: null,
                totalRevenue: { $sum: "$estimatedCost" },
                totalEnergy: { $sum: { $ifNull: ["$unitsConsumed", "$estimatedEnergy"] } },
                totalSessions: { $sum: 1 }
            }}
          ],
          previousPeriod: [
            { $match: { createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
            { $group: {
                _id: null,
                totalRevenue: { $sum: "$estimatedCost" },
                totalEnergy: { $sum: { $ifNull: ["$unitsConsumed", "$estimatedEnergy"] } },
                totalSessions: { $sum: 1 }
            }}
          ],
          allTime: [
             { $group: {
                _id: null,
                totalRevenue: { $sum: "$estimatedCost" },
                totalEnergy: { $sum: { $ifNull: ["$unitsConsumed", "$estimatedEnergy"] } },
                totalSessions: { $sum: 1 }
            }}
          ],
          today: [
            { 
              $match: { 
                createdAt: { 
                  $gte: new Date(new Date().setHours(0,0,0,0)), 
                  $lt: new Date(new Date().setHours(23,59,59,999)) 
                } 
              } 
            },
            { $group: {
                _id: null,
                todayRevenue: { $sum: "$estimatedCost" },
                todayEnergy: { $sum: { $ifNull: ["$unitsConsumed", "$estimatedEnergy"] } },
                todaySessions: { $sum: 1 }
            }}
          ]
        }
      }
    ]);

    const currentBookings = bookingStats[0].currentPeriod[0] || { totalRevenue: 0, totalEnergy: 0, totalSessions: 0 };
    const prevBookings = bookingStats[0].previousPeriod[0] || { totalRevenue: 0, totalEnergy: 0, totalSessions: 0 };
    const allTimeBookings = bookingStats[0].allTime[0] || { totalRevenue: 0, totalEnergy: 0, totalSessions: 0 };
    const todayBookings = bookingStats[0].today[0] || { todayRevenue: 0, todayEnergy: 0, todaySessions: 0 };

    const totalRevenue = allTimeBookings.totalRevenue;
    const totalSessions = allTimeBookings.totalSessions;
    const totalEnergy = Math.floor(allTimeBookings.totalEnergy);
    const co2Saved = Math.floor((totalEnergy * 0.85) / 1000);

    const prevEnergy = Math.floor(prevBookings.totalEnergy);
    const prevCO2 = Math.floor((prevEnergy * 0.85) / 1000);

    const revenueGrowth = calculateGrowth(currentBookings.totalRevenue, prevBookings.totalRevenue);
    const sessionsGrowth = calculateGrowth(currentBookings.totalSessions, prevBookings.totalSessions);
    const energyGrowth = calculateGrowth(Math.floor(currentBookings.totalEnergy), prevEnergy);
    
    // CO2 Growth is basically the same as Energy growth but calculated for completeness
    const currentCO2 = Math.floor((Math.floor(currentBookings.totalEnergy) * 0.85) / 1000);
    const co2Growth = calculateGrowth(currentCO2, prevCO2);

    // Market Revenue
    const marketRevenueAgg = await MarketOrder.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const marketRevenue = marketRevenueAgg[0]?.total || 0;

    const stats = {
      totalUsers, usersGrowth,
      totalStations, stationsGrowth,
      totalPartners, partnersGrowth,
      totalSessions, sessionsGrowth,
      totalEnergy, energyGrowth,
      co2Saved, co2Growth,
      totalRevenue, revenueGrowth,
      marketRevenue,
      activeStations,
      offlineStations,
      todaySessions: todayBookings.todaySessions,
      todayEnergy: Math.floor(todayBookings.todayEnergy),
      todayRevenue: todayBookings.todayRevenue,
      mapData
    };

    // 3. Revenue Overview Data (Line Chart - Dynamic period)
    const revenueStartDate = new Date();
    revenueStartDate.setDate(now.getDate() - (revenueDays - 1));
    revenueStartDate.setHours(0,0,0,0);

    const dailyRevenue = await Booking.aggregate([
      { 
        $match: { 
          ...bookingMatch,
          createdAt: { $gte: revenueStartDate }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%d %b", date: "$createdAt" } },
          value: { $sum: "$estimatedCost" }
        }
      }
    ]);

    const revenueData = [];
    for (let i = revenueDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const name = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const record = dailyRevenue.find(r => r._id === name);
      revenueData.push({ name, value: record ? record.value : 0 });
    }

    // 4. Energy Consumption Data (Bar Chart - Dynamic period)
    const energyStartDate = new Date();
    energyStartDate.setDate(now.getDate() - (energyDays - 1));
    energyStartDate.setHours(0,0,0,0);

    const dailyEnergy = await Booking.aggregate([
      { 
        $match: { 
          ...bookingPaidMatch,
          createdAt: { $gte: energyStartDate }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%d %b", date: "$createdAt" } },
          value: { $sum: "$estimatedEnergy" }
        }
      }
    ]);

    const energyData = [];
    for (let i = energyDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const labelInterval = energyDays <= 14 ? 1 : energyDays <= 30 ? 5 : 10;
      const name = i % labelInterval === 0 ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '';
      const exactDateString = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const record = dailyEnergy.find(r => r._id === exactDateString);
      energyData.push({ name, value: record ? Math.floor(record.value) : 0 });
    }

    // 5. Revenue by City (Donut & Top Cities List)
    const cityAgg = await Booking.aggregate([
      { $match: bookingPaidMatch },
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
          currentRevenue: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", thirtyDaysAgo] }, "$estimatedCost", 0]
            }
          },
          prevRevenue: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ["$createdAt", sixtyDaysAgo] }, { $lt: ["$createdAt", thirtyDaysAgo] }] },
                "$estimatedCost",
                0
              ]
            }
          }
        } 
      },
      { $sort: { revenue: -1 } }
    ]);

    const colors = ['#8CC63F', '#38BDF8', '#8B5CF6', '#F59E0B', '#9CA3AF'];
    let revenueCityData = [];
    let topCities = [];
    
    if (cityAgg.length > 0) {
      const mappedTotalRevenue = cityAgg.reduce((acc, curr) => acc + curr.revenue, 0);
      revenueCityData = cityAgg.slice(0, 5).map((c, i) => {
        const percentage = mappedTotalRevenue > 0 ? ((c.revenue / mappedTotalRevenue) * 100).toFixed(1) : 0;
        return {
          name: c._id || 'Unknown',
          value: parseFloat(percentage),
          color: colors[i % colors.length]
        };
      });

      topCities = cityAgg.slice(0, 5).map((c, i) => {
        return {
          id: i + 1,
          name: c._id || 'Unknown',
          revenue: `₹${c.revenue.toLocaleString()}`,
          growth: calculateGrowth(c.currentRevenue, c.prevRevenue)
        };
      });
    }

    // 6. Sessions by Connector (Donut)
    const connectorAgg = await Booking.aggregate([
      { $match: { ...bookingMatch, status: { $in: ['Completed', 'Confirmed'] } } },
      { $group: { _id: "$connectorType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    let sessionsConnectorData = [];
    if (connectorAgg.length > 0) {
      const mappedTotalSessions = connectorAgg.reduce((acc, curr) => acc + curr.count, 0);
      sessionsConnectorData = connectorAgg.map((c, i) => {
        const percentage = mappedTotalSessions > 0 ? ((c.count / mappedTotalSessions) * 100).toFixed(1) : 0;
        return {
          name: c._id || 'Unknown',
          value: parseFloat(percentage),
          color: colors[i % colors.length]
        };
      });
    }

    // 7. Recent Activities
    let logQuery = {};
    if (req.admin && req.admin.adminType === 'subadmin') {
      logQuery.user = req.admin.name;
    }
    const recentLogs = await AuditLog.find(logQuery).sort({ createdAt: -1 }).limit(5).lean();
    let recentActivities = [];
    if (recentLogs.length > 0) {
      recentActivities = recentLogs.map((log, i) => {
        const diffMs = new Date() - new Date(log.createdAt);
        const diffMins = Math.floor(diffMs / 60000);
        let timeStr;
        if (diffMins === 0) {
          timeStr = 'Just now';
        } else if (diffMins < 60) {
          timeStr = `${diffMins} min ago`;
        } else if (diffMins < 720) {
          timeStr = `${Math.floor(diffMins / 60)} hrs ago`;
        } else {
          const diffDays = Math.max(1, Math.round(diffMins / 1440));
          timeStr = diffDays === 1 ? `1 day ago` : `${diffDays} days ago`;
        }

        let iconType = 'Zap';
        let color = 'text-blue-600';
        let bg = 'bg-blue-100';

        if (log.action.toLowerCase().includes('create') || log.action.toLowerCase().includes('register')) {
          iconType = 'UserPlus'; color = 'text-emerald-600'; bg = 'bg-emerald-100';
        } else if (log.action.toLowerCase().includes('payment')) {
          iconType = 'Wallet'; color = 'text-amber-600'; bg = 'bg-amber-100';
        }

        return {
          id: log._id,
          title: `${log.action} - ${log.module}`,
          time: timeStr,
          iconType,
          color,
          bg
        }
      });
    } else {
      recentActivities = [
        { id: 1, title: 'No recent activity', time: 'Just now', iconType: 'Zap', color: 'text-gray-400', bg: 'bg-gray-100' }
      ];
    }

    // 8. Top Stations
    const stationsAgg = await Booking.aggregate([
      { $match: bookingPaidMatch },
      { 
        $group: { 
          _id: "$station", 
          revenue: { $sum: "$estimatedCost" },
          currentRevenue: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", thirtyDaysAgo] }, "$estimatedCost", 0]
            }
          },
          prevRevenue: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ["$createdAt", sixtyDaysAgo] }, { $lt: ["$createdAt", thirtyDaysAgo] }] },
                "$estimatedCost",
                0
              ]
            }
          }
        } 
      },
      { $sort: { revenue: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'stations',
          localField: '_id',
          foreignField: '_id',
          as: 'stationDetails'
        }
      },
      { $unwind: "$stationDetails" }
    ]);

    let topStations = [];
    if (stationsAgg.length > 0) {
      topStations = stationsAgg.map((st, i) => ({
        id: st._id,
        name: st.stationDetails.name,
        revenue: `₹${st.revenue.toLocaleString()}`,
        growth: calculateGrowth(st.currentRevenue, st.prevRevenue)
      }));
    }

    res.json({
      stats,
      charts: {
        revenueData,
        energyData,
        revenueCityData,
        sessionsConnectorData,
      },
      recentActivities,
      topCities,
      topStations
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardData
};
