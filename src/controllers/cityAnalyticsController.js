const Station = require('../models/Station');
const Booking = require('../models/Booking');
const User = require('../models/User');

const STATE_CITY_MAP = {
  'Maharashtra': ['Mumbai', 'Pune'],
  'Delhi NCR': ['New Delhi', 'Gurugram', 'Grater Noida'],
  'Karnataka': ['Bengaluru'],
  'Telangana': ['Hyderabad'],
  'Uttar Pradesh': ['Lucknow', 'Grater Noida'],
  'Tamil Nadu': ['Chennai'],
  'West Bengal': ['Kolkata'],
  'Rajasthan': ['Jaipur'],
  'Jammu & Kashmir': ['Kashmir']
};

const CONNECTOR_COLORS = {
  'CCS2': '#8CC63F',
  'AC Type 2': '#3B82F6',
  'Type 2': '#3B82F6',
  'Type2': '#3B82F6',
  'CHAdeMO': '#F59E0B',
  'AC Type 1': '#F97316',
  'Type 1': '#F97316',
  'GB/T': '#8B5CF6',
  'AC': '#10B981',
  'DC': '#06B6D4'
};

// Helper to calculate percentage change
const getGrowthPercentage = (current, previous) => {
  if (!previous || previous === 0) {
    return current > 0 ? '+100%' : '+0.0%';
  }
  const pct = (((current - previous) / previous) * 100).toFixed(1);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
};

// @desc    Get City Analytics Data
// @route   GET /api/analytics/city
// @access  Admin
const getCityAnalyticsData = async (req, res) => {
  try {
    const { city, state, range = '30d' } = req.query;

    // 1. Fetch all stations to know available cities and states
    const allStations = await Station.find(
      {},
      'name location city state address latitude longitude connectors connectorTypes powerCapacity status'
    ).lean();

    const availableCities = [...new Set(allStations.map(s => s.city).filter(Boolean))].sort();
    const dbStates = [...new Set(allStations.map(s => s.state).filter(Boolean))].sort();
    const availableStates = ['All States', ...(dbStates.length > 0 ? dbStates : Object.keys(STATE_CITY_MAP).sort())];

    // 2. Filter stations based on city and state
    let selectedCity = city || 'All';
    let selectedState = state || 'All States';

    let matchingStations = allStations;

    if (selectedCity && selectedCity !== 'All' && selectedCity !== 'all') {
      matchingStations = allStations.filter(
        s => s.city && s.city.toLowerCase() === selectedCity.toLowerCase()
      );
    } else if (selectedState && selectedState !== 'All' && selectedState !== 'All States') {
      matchingStations = allStations.filter(
        s => (s.state && s.state.toLowerCase() === selectedState.toLowerCase()) ||
             ((STATE_CITY_MAP[selectedState] || []).map(c => c.toLowerCase()).includes((s.city || '').toLowerCase()))
      );
    }

    const matchingStationIds = matchingStations.map(s => s._id);

    // 3. Date range calculation
    let dateFilter = {};
    let days = 30;
    if (range === '7d') days = 7;
    else if (range === '30d') days = 30;
    else if (range === '90d') days = 90;
    else if (range === 'all') days = null;

    const now = new Date();
    if (days) {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: startDate } };
    }

    // 4. Fetch current period bookings
    const bookingQuery = {
      station: { $in: matchingStationIds },
      status: { $ne: 'Cancelled' },
      ...dateFilter
    };

    const bookings = await Booking.find(bookingQuery).lean();

    // 5. Fetch previous period bookings for growth calculation
    let prevBookings = [];
    if (days) {
      const prevStartDate = new Date(now);
      prevStartDate.setDate(prevStartDate.getDate() - (days * 2));
      prevStartDate.setHours(0, 0, 0, 0);

      const prevEndDate = new Date(now);
      prevEndDate.setDate(prevEndDate.getDate() - days);
      prevEndDate.setHours(0, 0, 0, 0);

      prevBookings = await Booking.find({
        station: { $in: matchingStationIds },
        status: { $ne: 'Cancelled' },
        createdAt: { $gte: prevStartDate, $lt: prevEndDate }
      }).lean();
    }

    // 6. Aggregate KPIs for current period
    const totalSessions = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.estimatedCost || 0), 0);

    const totalEnergy = Math.round(bookings.reduce((sum, b) => {
      const energy = b.unitsConsumed || b.estimatedEnergy ||
        (b.estimatedCost && b.pricePerUnit ? Math.round(b.estimatedCost / b.pricePerUnit) : Math.round((b.estimatedCost || 0) / 18)) || 15;
      return sum + energy;
    }, 0));

    const uniqueUsersSet = new Set(bookings.map(b => b.user?.toString()).filter(Boolean));
    const totalUsers = uniqueUsersSet.size;

    // Aggregate KPIs for previous period
    const prevSessions = prevBookings.length;
    const prevRevenue = prevBookings.reduce((sum, b) => sum + (b.estimatedCost || 0), 0);
    const prevEnergy = Math.round(prevBookings.reduce((sum, b) => {
      const energy = b.unitsConsumed || b.estimatedEnergy ||
        (b.estimatedCost && b.pricePerUnit ? Math.round(b.estimatedCost / b.pricePerUnit) : Math.round((b.estimatedCost || 0) / 18)) || 15;
      return sum + energy;
    }, 0));
    const prevUsers = new Set(prevBookings.map(b => b.user?.toString()).filter(Boolean)).size;

    const stats = {
      users: {
        value: totalUsers,
        change: getGrowthPercentage(totalUsers, prevUsers)
      },
      energy: {
        value: totalEnergy,
        change: getGrowthPercentage(totalEnergy, prevEnergy)
      },
      revenue: {
        value: totalRevenue,
        change: getGrowthPercentage(totalRevenue, prevRevenue)
      },
      sessions: {
        value: totalSessions,
        change: getGrowthPercentage(totalSessions, prevSessions)
      }
    };

    // 7. Dynamic Daily / Time-Series Charts (Energy & Revenue)
    const numDays = days || 30;
    const chartDaysCount = Math.min(numDays, 30);
    const dailyMap = {};

    for (let i = chartDaysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      dailyMap[key] = { name: key, energy: 0, revenue: 0 };
    }

    bookings.forEach(b => {
      const bDate = new Date(b.createdAt);
      const key = bDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (dailyMap[key]) {
        const energy = b.unitsConsumed || b.estimatedEnergy ||
          (b.estimatedCost && b.pricePerUnit ? Math.round(b.estimatedCost / b.pricePerUnit) : Math.round((b.estimatedCost || 0) / 18)) || 15;
        dailyMap[key].energy += energy;
        dailyMap[key].revenue += (b.estimatedCost || 0);
      }
    });

    const energyData = Object.values(dailyMap).map(d => ({
      name: d.name,
      value: Math.round(d.energy)
    }));

    const revenueData = Object.values(dailyMap).map(d => ({
      name: d.name,
      value: Math.round(d.revenue)
    }));

    // 8. Top Performing Stations in this City/Filter
    const stationMap = {};
    matchingStations.forEach(st => {
      stationMap[st._id.toString()] = {
        id: st._id,
        name: st.name,
        location: st.address || st.location || st.city,
        city: st.city,
        sessions: 0,
        energy: 0,
        revenue: 0
      };
    });

    bookings.forEach(b => {
      const stId = b.station?.toString();
      if (stationMap[stId]) {
        stationMap[stId].sessions += 1;
        const energy = b.unitsConsumed || b.estimatedEnergy ||
          (b.estimatedCost && b.pricePerUnit ? Math.round(b.estimatedCost / b.pricePerUnit) : Math.round((b.estimatedCost || 0) / 18)) || 15;
        stationMap[stId].energy += energy;
        stationMap[stId].revenue += (b.estimatedCost || 0);
      }
    });

    const topStations = Object.values(stationMap)
      .sort((a, b) => b.revenue - a.revenue || b.sessions - a.sessions)
      .slice(0, 6)
      .map(st => ({
        id: st.id,
        name: st.name,
        location: st.location,
        city: st.city,
        sessions: st.sessions,
        energy: Math.round(st.energy),
        revenue: st.revenue
      }));

    // 9. Top Connector Types (From actual bookings, fallback to station connectors)
    const connectorCounts = {};
    bookings.forEach(b => {
      const type = (b.connectorType || 'CCS2').trim();
      connectorCounts[type] = (connectorCounts[type] || 0) + 1;
    });

    // If no bookings, fallback to station connector counts
    if (Object.keys(connectorCounts).length === 0) {
      matchingStations.forEach(st => {
        (st.connectorTypes || []).forEach(ct => {
          const type = (ct.type || 'CCS2').trim();
          connectorCounts[type] = (connectorCounts[type] || 0) + (ct.totalCount || 1);
        });
      });
    }

    const totalConnectorUses = Object.values(connectorCounts).reduce((a, b) => a + b, 0) || 1;
    const connectorData = Object.entries(connectorCounts)
      .map(([name, count]) => ({
        name,
        value: parseFloat(((count / totalConnectorUses) * 100).toFixed(1)),
        color: CONNECTOR_COLORS[name] || '#10B981'
      }))
      .sort((a, b) => b.value - a.value);

    // Fallback if completely empty
    if (connectorData.length === 0) {
      connectorData.push(
        { name: 'CCS2', value: 65.0, color: '#8CC63F' },
        { name: 'AC Type 2', value: 25.0, color: '#3B82F6' },
        { name: 'CHAdeMO', value: 10.0, color: '#F59E0B' }
      );
    }

    res.json({
      selectedCity,
      selectedState,
      dateRange: range,
      availableCities,
      availableStates,
      stats,
      energyData,
      revenueData,
      topStations,
      connectorData
    });

  } catch (error) {
    console.error('Error in getCityAnalyticsData:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCityAnalyticsData
};
