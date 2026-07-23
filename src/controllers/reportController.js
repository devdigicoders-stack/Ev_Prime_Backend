const User = require('../models/User');
const Station = require('../models/Station');
const Partner = require('../models/Partner');
const Ticket = require('../models/Ticket');
const Booking = require('../models/Booking');

// Helper to get date range filter
const getDateFilter = (period, startDate, endDate) => {
  const query = {};
  const now = new Date();

  if (startDate && endDate) {
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);
    query.createdAt = { $gte: new Date(startDate), $lt: end };
  } else if (period === 'daily' || period === 'Today' || period === '1d') {
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));
    query.createdAt = { $gte: startOfDay, $lte: endOfDay };
  } else if (period === 'weekly' || period === 'This Week' || period === '7d') {
    const pastWeek = new Date();
    pastWeek.setDate(pastWeek.getDate() - 7);
    query.createdAt = { $gte: pastWeek };
  } else if (period === 'monthly' || period === 'This Month' || period === '30d') {
    const pastMonth = new Date();
    pastMonth.setDate(pastMonth.getDate() - 30);
    query.createdAt = { $gte: pastMonth };
  }
  return query;
};

// @desc    Get Analytics & Reports Data for Admin (Daily, Weekly, Monthly, Most Used Stations)
// @route   GET /api/reports/analytics
// @access  Admin
const getAnalyticsReportAdmin = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    const dateQuery = getDateFilter(period, startDate, endDate);

    const bookings = await Booking.find(dateQuery)
      .populate('station', 'name city state location partner')
      .populate('user', 'name email mobile phone')
      .sort('-createdAt');

    let totalRevenue = 0;
    let totalSessions = bookings.length;
    let totalEnergy = 0;
    let carbonSaved = 0;
    let completedSessions = 0;
    let cancelledSessions = 0;

    const stationMap = {};

    bookings.forEach(b => {
      const amount = b.estimatedCost || 0;
      const energy = b.unitsConsumed || b.estimatedEnergy || 0;
      const carbon = b.carbonSavedKg || 0;

      if (b.status === 'Completed' || b.status === 'Confirmed' || b.status === 'Ongoing') {
        totalRevenue += amount;
        totalEnergy += energy;
        carbonSaved += carbon;
      }
      if (b.status === 'Completed') completedSessions++;
      if (b.status === 'Cancelled') cancelledSessions++;

      const stationId = b.station?._id ? b.station._id.toString() : 'unknown';
      const stationName = b.station?.name || 'Unknown Station';
      const stationCity = b.station?.city || 'N/A';

      if (!stationMap[stationId]) {
        stationMap[stationId] = {
          id: stationId,
          name: stationName,
          city: stationCity,
          totalBookings: 0,
          totalEnergy: 0,
          totalRevenue: 0,
        };
      }
      stationMap[stationId].totalBookings += 1;
      stationMap[stationId].totalEnergy += energy;
      stationMap[stationId].totalRevenue += amount;
    });

    const mostUsedStations = Object.values(stationMap)
      .sort((a, b) => b.totalBookings - a.totalBookings)
      .slice(0, 10);

    const exportData = bookings.map(b => ({
      bookingId: b.bookingId || b._id,
      date: b.createdAt,
      customerName: b.user?.name || 'N/A',
      stationName: b.station?.name || 'N/A',
      city: b.station?.city || 'N/A',
      connectorType: b.connectorType || 'N/A',
      powerConsumed: b.unitsConsumed || b.estimatedEnergy || 0,
      amount: b.estimatedCost || 0,
      paymentStatus: b.paymentStatus || 'Pending',
      status: b.status || 'Confirmed'
    }));

    res.json({
      success: true,
      period,
      summary: {
        totalRevenue,
        totalSessions,
        totalEnergy: Math.round(totalEnergy * 100) / 100,
        carbonSaved: Math.round(carbonSaved * 100) / 100,
        completedSessions,
        cancelledSessions
      },
      mostUsedStations,
      data: exportData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate CSV/JSON Report
// @route   GET /api/reports/generate
// @access  Admin
const generateReport = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    if (!type) {
      return res.status(400).json({ message: 'Report type is required' });
    }

    let query = {};
    if (startDate && endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      query.createdAt = { $gte: new Date(startDate), $lt: end };
    }

    let reportData = [];
    let filename = `${type}_Report_${new Date().toISOString().split('T')[0]}.csv`;

    switch (type.toLowerCase()) {
      case 'user': {
        const users = await User.find(query).lean();
        reportData = users.map(u => ({
          ID: u._id,
          Name: u.name,
          Email: u.email,
          Phone: u.phone,
          Role: u.role,
          Status: u.status,
          Registered_At: new Date(u.createdAt).toLocaleString()
        }));
        break;
      }
      case 'station': {
        const stations = await Station.find(query).lean();
        reportData = stations.map(s => ({
          ID: s._id,
          Name: s.name,
          City: s.city,
          State: s.state,
          Status: s.status,
          Total_Connectors: s.connectors ? s.connectors.length : 0,
          Created_At: new Date(s.createdAt).toLocaleString()
        }));
        break;
      }
      case 'partner': {
        const partners = await Partner.find(query).lean();
        reportData = partners.map(p => ({
          ID: p._id,
          Name: p.name,
          Company: p.companyName,
          Email: p.email,
          Phone: p.phone,
          Type: p.partnerType,
          Status: p.status,
          Created_At: new Date(p.createdAt).toLocaleString()
        }));
        break;
      }
      case 'ticket': {
        const tickets = await Ticket.find(query).lean();
        reportData = tickets.map(t => ({
          Ticket_ID: t.ticketId,
          User: t.user,
          Subject: t.subject,
          Category: t.category,
          Priority: t.priority,
          Status: t.status,
          Created_At: new Date(t.createdAt).toLocaleString()
        }));
        break;
      }
      case 'transaction':
      case 'revenue': {
        const bookings = await Booking.find(query).populate('station').populate('user').lean();
        reportData = bookings.map(b => ({
          Booking_ID: b.bookingId || b._id,
          Customer: b.user?.name || 'N/A',
          Station: b.station?.name || 'N/A',
          Amount: b.estimatedCost || 0,
          Energy_kWh: b.unitsConsumed || b.estimatedEnergy || 0,
          Payment_Status: b.paymentStatus || 'Pending',
          Status: b.status,
          Date: new Date(b.createdAt).toLocaleString()
        }));
        break;
      }
      default: {
        reportData = [{ Data: 'Template', Status: 'Pending', Notes: 'Placeholder template for ' + type }];
        break;
      }
    }

    res.json({
      filename,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error generating report', error: error.message });
  }
};

module.exports = {
  getAnalyticsReportAdmin,
  generateReport,
};
