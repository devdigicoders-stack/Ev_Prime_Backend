const Partner = require('../models/Partner');
const Station = require('../models/Station');
const Booking = require('../models/Booking');
const jwt = require('jsonwebtoken');
const { createAuditLog } = require('./auditController');
const notificationService = require('../services/notificationService');
const PartnerNotification = require('../models/PartnerNotification');
const PartnerComplaint = require('../models/PartnerComplaint');
const Review = require('../models/Review');

// @desc    Create a new partner
// @route   POST /api/partner
// @access  Admin
const createPartner = async (req, res) => {
  try {
    const { name, contactPerson, email, phone, status, stationsCount } = req.body;
    const partnerExists = await Partner.findOne({ email });
    if (partnerExists) return res.status(400).json({ message: 'Partner with this email already exists' });

    const partner = await Partner.create({ name, contactPerson, email, phone, status: status || 'Active', stationsCount: stationsCount || 0 });

    await createAuditLog({
      user: req.admin ? req.admin.name : 'System',
      role: req.admin ? req.admin.role : 'Super Admin',
      action: 'Created', module: 'Partner Management',
      details: `Partner ${name} was created successfully.`, ip: req.ip
    });
    res.status(201).json(partner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all partners
// @route   GET /api/partner
// @access  Admin
const getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find({}).select('-appPassword');
    res.json(partners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update partner
// @route   PUT /api/partner/:id
// @access  Admin
const updatePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json({ message: 'Partner not found' });

    // Don't allow password update via this route
    const { appPassword, ...updateData } = req.body;

    const updatedPartner = await Partner.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-appPassword');

    await createAuditLog({
      user: req.admin ? req.admin.name : 'System',
      role: req.admin ? req.admin.role : 'Super Admin',
      action: 'Updated', module: 'Partner Management',
      details: `Partner ${updatedPartner.name} was updated.`, ip: req.ip
    });
    res.json(updatedPartner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete partner
// @route   DELETE /api/partner/:id
// @access  Admin
const deletePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json({ message: 'Partner not found' });

    const partnerName = partner.name;
    await partner.deleteOne();

    await createAuditLog({
      user: req.admin ? req.admin.name : 'System',
      role: req.admin ? req.admin.role : 'Super Admin',
      action: 'Deleted', module: 'Partner Management',
      details: `Partner ${partnerName} was deleted.`, ip: req.ip
    });
    res.json({ message: 'Partner removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Set or update partner app credentials
// @route   POST /api/partner/:id/credentials
// @access  Admin
const setPartnerCredentials = async (req, res) => {
  try {
    const { appUsername, appPassword } = req.body;
    if (!appUsername || !appPassword) return res.status(400).json({ message: 'Username and password are required' });

    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json({ message: 'Partner not found' });

    // Check username uniqueness (excluding self)
    const existing = await Partner.findOne({ appUsername, _id: { $ne: req.params.id } });
    if (existing) return res.status(400).json({ message: 'Username already taken by another partner' });

    partner.appUsername = appUsername;
    partner.appPassword = appPassword; // will be hashed by pre-save hook
    partner.hasCredentials = true;
    await partner.save();

    await createAuditLog({
      user: req.admin ? req.admin.name : 'System',
      role: req.admin ? req.admin.role : 'Super Admin',
      action: 'Updated', module: 'Partner Management',
      details: `App credentials set for partner ${partner.name}.`, ip: req.ip
    });
    res.json({ message: 'Credentials set successfully', appUsername: partner.appUsername, hasCredentials: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change partner app password
// @route   PUT /api/partner/:id/change-password
// @access  Admin
const changePartnerPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json({ message: 'Partner not found' });

    partner.appPassword = newPassword; // will be hashed by pre-save hook
    await partner.save();

    await createAuditLog({
      user: req.admin ? req.admin.name : 'System',
      role: req.admin ? req.admin.role : 'Super Admin',
      action: 'Updated', module: 'Partner Management',
      details: `Password changed for partner ${partner.name}.`, ip: req.ip
    });
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get partner full history (stations, bookings, revenue)
// @route   GET /api/partner/:id/history
// @access  Admin
const getPartnerHistory = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id).select('-appPassword');
    if (!partner) return res.status(404).json({ message: 'Partner not found' });

    // Get stations belonging to this partner (by name match)
    const stations = await Station.find({ partner: partner.name });
    const stationIds = stations.map(s => s._id);

    // Get bookings for these stations
    const bookings = await Booking.find({ station: { $in: stationIds } })
      .populate('user', 'name email phone')
      .populate('station', 'name location city')
      .sort({ createdAt: -1 })
      .limit(100);

    // Revenue stats
    const completedBookings = bookings.filter(b => b.paymentStatus === 'Paid');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.estimatedCost || 0), 0);
    const totalBookings = bookings.length;
    const activeStations = stations.filter(s => s.status === 'Active').length;

    // Monthly revenue (last 6 months)
    const monthlyRevenue = {};
    completedBookings.forEach(b => {
      const month = new Date(b.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (b.estimatedCost || 0);
    });

    res.json({
      partner,
      stats: { totalRevenue, totalBookings, totalStations: stations.length, activeStations },
      stations,
      bookings,
      monthlyRevenue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Partner app registration
// @route   POST /api/partner/register
// @access  Public
const registerPartner = async (req, res) => {
  try {
    const { name, contactPerson, email, phone, appUsername, appPassword, businessType, businessAddress, gstNumber, panNumber } = req.body;
    
    if (!name || !contactPerson || !email || !phone || !appUsername || !appPassword) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const partnerExists = await Partner.findOne({ email });
    if (partnerExists) return res.status(400).json({ message: 'Partner with this email already exists' });

    const existingUser = await Partner.findOne({ appUsername });
    if (existingUser) return res.status(400).json({ message: 'Username already taken' });

    const partner = await Partner.create({
      name,
      contactPerson,
      email,
      phone,
      appUsername,
      appPassword,
      businessType,
      businessAddress,
      gstNumber,
      panNumber,
      hasCredentials: true,
      status: 'Pending',
    });

    await createAuditLog({
      user: partner.name,
      role: 'Partner',
      action: 'Registered', module: 'Partner Management',
      details: `Partner ${name} registered via App and is pending approval.`, ip: req.ip
    });

    res.status(201).json({ success: true, message: 'Registration successful. Waiting for admin approval.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Partner app login
// @route   POST /api/partner/login
// @access  Public
const partnerLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

    const partner = await Partner.findOne({ appUsername: username });
    if (!partner || !partner.hasCredentials) return res.status(401).json({ message: 'Invalid credentials' });
    
    if (partner.status === 'Pending') return res.status(403).json({ message: 'Your account is pending admin approval.' });
    if (partner.status === 'Rejected') return res.status(403).json({ message: 'Your account application was rejected.' });
    if (partner.status === 'Blocked') return res.status(403).json({ message: 'Your account has been blocked. Contact admin.' });

    const isMatch = await partner.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: partner._id, type: 'partner' }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      _id: partner._id,
      name: partner.name,
      contactPerson: partner.contactPerson,
      email: partner.email,
      phone: partner.phone,
      appUsername: partner.appUsername,
      status: partner.status,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Partner forgot password (send OTP)
// @route   POST /api/partner/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });

    const partner = await Partner.findOne({ phone });
    if (!partner || !partner.hasCredentials) {
      return res.status(404).json({ message: 'No active partner found with this phone number' });
    }

    // Generate fixed OTP for now as requested
    const otp = '1234';
    
    // Set expiry to 10 minutes
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);

    partner.resetPasswordOtp = otp;
    partner.resetPasswordExpires = expires;
    await partner.save();

    res.json({ success: true, message: 'OTP sent successfully to your registered mobile number.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Partner verify OTP
// @route   POST /api/partner/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP are required' });

    const partner = await Partner.findOne({ phone });
    if (!partner) return res.status(404).json({ message: 'Partner not found' });

    if (partner.resetPasswordOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (partner.resetPasswordExpires < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Success, we can return a temporary token so they can reset their password
    const resetToken = jwt.sign({ id: partner._id, type: 'partner_reset' }, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.json({ success: true, message: 'OTP verified successfully', resetToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Partner reset password
// @route   POST /api/partner/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) return res.status(400).json({ message: 'Token and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (decoded.type !== 'partner_reset') {
      return res.status(400).json({ message: 'Invalid token type' });
    }

    const partner = await Partner.findById(decoded.id);
    if (!partner) return res.status(404).json({ message: 'Partner not found' });

    partner.appPassword = newPassword; // Will be hashed by pre-save hook
    partner.resetPasswordOtp = undefined;
    partner.resetPasswordExpires = undefined;
    await partner.save();

    res.json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Partner: Get own profile
// @route   GET /api/partner/me
// @access  Partner
const getMyProfile = async (req, res) => {
  try {
    res.json(req.partner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Partner: Get own stations
// @route   GET /api/partner/me/stations
// @access  Partner
const getMyStations = async (req, res) => {
  try {
    const stations = await Station.find({ partner: req.partner.name });
    res.json({ success: true, data: stations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Partner: Get own bookings
// @route   GET /api/partner/me/bookings
// @access  Partner
const getMyBookings = async (req, res) => {
  try {
    const stations = await Station.find({ partner: req.partner.name });
    const stationIds = stations.map(s => s._id);
    const { status, dateFilter, limit = 50, page = 1 } = req.query;
    const filter = { station: { $in: stationIds } };
    if (status) filter.status = status;

    if (dateFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateFilter === 'Today') {
        filter.createdAt = { $gte: today };
      } else if (dateFilter === 'This Week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filter.createdAt = { $gte: weekAgo };
      } else if (dateFilter === 'This Month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filter.createdAt = { $gte: monthAgo };
      }
    }

    const bookings = await Booking.find(filter)
      .populate('user', 'name email mobile')
      .populate('station', 'name location city')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    const total = await Booking.countDocuments(filter);
    res.json({ success: true, data: bookings, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Partner: Get own revenue stats
// @route   GET /api/partner/me/revenue
// @access  Partner
const getMyRevenue = async (req, res) => {
  try {
    const { period = 'All Time' } = req.query;
    const stations = await Station.find({ partner: req.partner.name });
    const stationIds = stations.map(s => s._id);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let currentPeriodFilter = {};
    let previousPeriodFilter = {};
    let trendLabel = '-';
    let prevLabel = 'Previous';

    if (period === 'Today') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      currentPeriodFilter = { $gte: today };
      previousPeriodFilter = { $gte: yesterday, $lt: today };
      trendLabel = 'vs yesterday';
      prevLabel = 'Yesterday';
    } else if (period === 'This Week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
      
      currentPeriodFilter = { $gte: startOfWeek };
      previousPeriodFilter = { $gte: startOfLastWeek, $lt: startOfWeek };
      trendLabel = 'vs last week';
      prevLabel = 'Last Week';
    } else if (period === 'This Month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      
      currentPeriodFilter = { $gte: startOfMonth };
      previousPeriodFilter = { $gte: startOfLastMonth, $lt: startOfMonth };
      trendLabel = 'vs last month';
      prevLabel = 'Last Month';
    }

    const filterCurrent = { station: { $in: stationIds }, paymentStatus: 'Paid' };
    const filterPrev = { station: { $in: stationIds }, paymentStatus: 'Paid' };
    
    if (period !== 'All Time') {
      filterCurrent.createdAt = currentPeriodFilter;
      filterPrev.createdAt = previousPeriodFilter;
    }

    const currentBookings = await Booking.find(filterCurrent);
    const prevBookings = period === 'All Time' ? [] : await Booking.find(filterPrev);

    let totalRevenue = 0, acRevenue = 0, dcRevenue = 0, idleFees = 0;
    currentBookings.forEach(b => {
      const amount = b.estimatedCost || 0;
      totalRevenue += amount;
      const type = (b.connectorType || '').toUpperCase();
      if (type.includes('AC')) acRevenue += amount;
      else dcRevenue += amount;
      idleFees += amount * 0.05; // 5% idle fee estimation logic matches frontend
    });

    let prevRevenue = 0;
    prevBookings.forEach(b => prevRevenue += (b.estimatedCost || 0));

    let trendPercentage = 0;
    let isUp = true;
    if (period !== 'All Time' && prevRevenue > 0) {
      trendPercentage = ((totalRevenue - prevRevenue) / prevRevenue) * 100;
      isUp = trendPercentage >= 0;
      trendPercentage = Math.abs(trendPercentage);
    } else if (prevRevenue === 0 && totalRevenue > 0 && period !== 'All Time') {
      trendPercentage = 100;
      isUp = true;
    }

    res.json({
      success: true,
      data: {
        totalRevenue,
        acRevenue,
        dcRevenue,
        idleFees,
        prevRevenue,
        trendPercentage: trendPercentage.toFixed(1),
        isUp,
        trendLabel,
        prevLabel,
        totalBookings: currentBookings.length,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Partner: Get dashboard summary
// @route   GET /api/partner/me/dashboard
// @access  Partner
const getMyDashboard = async (req, res) => {
  try {
    const stations = await Station.find({ partner: req.partner.name });
    const stationIds = stations.map(s => s._id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const allBookings = await Booking.find({ station: { $in: stationIds } });
    const todayBookings = allBookings.filter(b => new Date(b.createdAt) >= today);
    const paidBookings = allBookings.filter(b => b.paymentStatus === 'Paid');
    const todayRevenue = todayBookings.filter(b => b.paymentStatus === 'Paid').reduce((sum, b) => sum + (b.estimatedCost || 0), 0);
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.estimatedCost || 0), 0);
    const activeStations = stations.filter(s => s.status === 'Active').length;
    const activeSessions = allBookings.filter(b => b.status === 'Confirmed').length;
    const recentBookings = await Booking.find({ station: { $in: stationIds } })
      .populate('user', 'name')
      .populate('station', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    const unreadNotificationsCount = await PartnerNotification.countDocuments({ partner: req.partner._id, isRead: false });

    res.json({
      success: true,
      data: {
        totalStations: stations.length,
        activeStations,
        activeSessions,
        totalBookings: allBookings.length,
        todayBookings: todayBookings.length,
        totalRevenue,
        todayRevenue,
        recentBookings,
        unreadNotificationsCount,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Partner: Add a new station
// @route   POST /api/partner/me/stations
// @access  Partner
const addMyStation = async (req, res) => {
  try {
    const { name, location, city, address, latitude, longitude, powerCapacity, connectors, status, connectorTypes, amenities, openHours } = req.body;
    
    // Inject partner name from auth token
    const partner = req.partner.name;

    if (!name || !location || !city || !connectors) {
      return res.status(400).json({ message: 'Please provide all required fields (name, location, city, connectors)' });
    }

    let parsedConnectorTypes = [];
    if (connectorTypes) {
      try {
        parsedConnectorTypes = typeof connectorTypes === 'string' ? JSON.parse(connectorTypes) : connectorTypes;
      } catch (e) { parsedConnectorTypes = []; }
    }

    const stationData = {
      name, location, city, address, latitude, longitude,
      powerCapacity, connectors, partner,
      status: status || 'Active',
      connectorTypes: parsedConnectorTypes,
      amenities: amenities ? (typeof amenities === 'string' ? JSON.parse(amenities) : amenities) : [],
      openHours: openHours || '24/7',
    };

    if (req.file) stationData.image = `/uploads/${req.file.filename}`;

    const station = await Station.create(stationData);
    res.status(201).json({ success: true, data: station });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Partner: Update own station
// @route   PUT /api/partner/me/stations/:id
// @access  Partner
const updateMyStation = async (req, res) => {
  try {
    // Ensure station belongs to partner
    const station = await Station.findOne({ _id: req.params.id, partner: req.partner.name });
    if (!station) return res.status(404).json({ success: false, message: 'Station not found or unauthorized' });

    const fields = ['name','location','city','address','latitude','longitude','powerCapacity','connectors','status','openHours'];
    fields.forEach(f => { if (req.body[f] !== undefined) station[f] = req.body[f]; });

    if (req.body.connectorTypes !== undefined) {
      try {
        station.connectorTypes = typeof req.body.connectorTypes === 'string'
          ? JSON.parse(req.body.connectorTypes)
          : req.body.connectorTypes;
      } catch (e) {}
    }
    if (req.body.amenities !== undefined) {
      try {
        station.amenities = typeof req.body.amenities === 'string'
          ? JSON.parse(req.body.amenities)
          : req.body.amenities;
      } catch (e) {}
    }
    if (req.body.pricing !== undefined) {
      try {
        station.pricing = typeof req.body.pricing === 'string'
          ? JSON.parse(req.body.pricing)
          : req.body.pricing;
      } catch (e) {}
    }
    if (req.file) station.image = `/uploads/${req.file.filename}`;

    const updated = await station.save();
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Partner: Get specific station analytics
// @route   GET /api/partner/me/stations/:id/analytics
// @access  Partner
const getStationAnalytics = async (req, res) => {
  try {
    const station = await Station.findOne({ _id: req.params.id, partner: req.partner.name });
    if (!station) return res.status(404).json({ success: false, message: 'Station not found or unauthorized' });

    // Calculate analytics from bookings
    const bookings = await Booking.find({ station: station._id });
    
    // Today metrics
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayBookings = bookings.filter(b => new Date(b.createdAt) >= today);
    
    const todaySessions = todayBookings.length;
    const todayEnergy = todayBookings.reduce((sum, b) => sum + (b.estimatedEnergy || 0), 0);
    const todayRevenue = todayBookings.filter(b => b.paymentStatus === 'Paid').reduce((sum, b) => sum + (b.estimatedCost || 0), 0);
    
    // Total metrics
    const totalSessions = bookings.length;
    const totalEnergy = bookings.reduce((sum, b) => sum + (b.estimatedEnergy || 0), 0);
    const totalRevenue = bookings.filter(b => b.paymentStatus === 'Paid').reduce((sum, b) => sum + (b.estimatedCost || 0), 0);

    res.json({
      success: true,
      data: {
        today: { sessions: todaySessions, energy: todayEnergy, revenue: todayRevenue },
        total: { sessions: totalSessions, energy: totalEnergy, revenue: totalRevenue },
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// NEW DYNAMIC QUICK ACTIONS
// ==========================================

const PartnerPayout = require('../models/PartnerPayout');
const PartnerPricingTemplate = require('../models/PartnerPricingTemplate');
const Offer = require('../models/Offer');

// Profile Update
const updateMyProfile = async (req, res) => {
  try {
    const partner = await Partner.findById(req.partner.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    if (req.body.name) partner.name = req.body.name;
    if (req.body.phone) partner.phone = req.body.phone;
    if (req.body.contactPerson) partner.contactPerson = req.body.contactPerson;
    if (req.body.email) partner.email = req.body.email;

    if (req.body.gstNumber !== undefined) partner.gstNumber = req.body.gstNumber;
    if (req.body.panNumber !== undefined) partner.panNumber = req.body.panNumber;
    if (req.body.businessAddress !== undefined) partner.businessAddress = req.body.businessAddress;
    if (req.body.businessType !== undefined) partner.businessType = req.body.businessType;

    if (req.body.bankDetails) {
      if (typeof req.body.bankDetails === 'string') {
        try { partner.bankDetails = JSON.parse(req.body.bankDetails); } catch(e) {}
      } else {
        partner.bankDetails = req.body.bankDetails;
      }
    }

    if (req.body.taxDetails) {
      if (typeof req.body.taxDetails === 'string') {
        try { partner.taxDetails = JSON.parse(req.body.taxDetails); } catch(e) {}
      } else {
        partner.taxDetails = req.body.taxDetails;
      }
    }

    if (req.body.securitySettings) {
      if (typeof req.body.securitySettings === 'string') {
        try { partner.securitySettings = JSON.parse(req.body.securitySettings); } catch(e) {}
      } else {
        partner.securitySettings = req.body.securitySettings;
      }
    }

    if (req.body.password) {
      if (!req.body.currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required' });
      }
      const isMatch = await partner.matchPassword(req.body.currentPassword);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid current password' });
      }
      partner.appPassword = req.body.password;
    }
    
    if (req.file) {
      partner.logo = `/uploads/${req.file.filename}`;
    }

    await partner.save();
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Document Upload
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const partner = await Partner.findById(req.partner.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    if (!partner.documents) partner.documents = [];
    
    partner.documents.push({
      title: req.body.title || 'Untitled Document',
      category: req.body.category || 'Business',
      url: `/uploads/${req.file.filename}`
    });

    await partner.save();
    res.json({ success: true, message: 'Document uploaded successfully', data: partner.documents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDocument = async (req, res) => {
  try {
    const partner = await Partner.findById(req.partner.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    const docIndex = partner.documents.findIndex(d => d._id.toString() === req.params.id);
    if (docIndex === -1) return res.status(404).json({ success: false, message: 'Document not found' });

    if (req.body.title) partner.documents[docIndex].title = req.body.title;
    if (req.body.category) partner.documents[docIndex].category = req.body.category;

    await partner.save();
    res.json({ success: true, message: 'Document updated successfully', data: partner.documents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const partner = await Partner.findById(req.partner.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    partner.documents = partner.documents.filter(d => d._id.toString() !== req.params.id);

    await partner.save();
    res.json({ success: true, message: 'Document deleted successfully', data: partner.documents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Staff Management
const getMyStaff = async (req, res) => {
  try {
    const partner = await Partner.findById(req.partner.id);
    res.json({ success: true, data: partner.staff || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addMyStaff = async (req, res) => {
  try {
    const partner = await Partner.findById(req.partner.id);
    if (!partner.staff) partner.staff = [];
    partner.staff.forEach(s => {
      if (s.role === 'Operator' || s.role === 'Viewer') s.role = 'Employee';
    });
    partner.staff.push({
      name: req.body.name,
      email: req.body.email,
      role: req.body.role || 'Employee'
    });
    await partner.save();
    res.json({ success: true, message: 'Staff member added', data: partner.staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeMyStaff = async (req, res) => {
  try {
    const partner = await Partner.findById(req.partner.id);
    partner.staff = partner.staff.filter(s => s._id.toString() !== req.params.staffId);
    await partner.save();
    res.json({ success: true, message: 'Staff member removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateMyStaff = async (req, res) => {
  try {
    const partner = await Partner.findById(req.partner.id);
    const staffIndex = partner.staff.findIndex(s => s._id.toString() === req.params.staffId);
    if (staffIndex === -1) return res.status(404).json({ success: false, message: 'Staff member not found' });

    if (req.body.name) partner.staff[staffIndex].name = req.body.name;
    if (req.body.email) partner.staff[staffIndex].email = req.body.email;
    if (req.body.role) partner.staff[staffIndex].role = req.body.role;

    partner.staff.forEach(s => {
      if (s.role === 'Operator' || s.role === 'Viewer') s.role = 'Employee';
    });

    await partner.save();
    res.json({ success: true, message: 'Staff member updated', data: partner.staff[staffIndex] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Payouts
const getMyPayouts = async (req, res) => {
  try {
    const payouts = await PartnerPayout.find({ partner: req.partner.id }).sort('-createdAt');
    res.json({ success: true, data: payouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const requestPayout = async (req, res) => {
  try {
    const payout = await PartnerPayout.create({
      partner: req.partner.id,
      amount: req.body.amount,
      bankDetails: req.body.bankDetails,
    });
    
    const partner = await Partner.findById(req.partner.id);
    if (partner) {
      await notificationService.sendToAllAdmins(
        'New Payout Request 💰',
        `Partner ${partner.name} has requested a withdrawal of ₹${req.body.amount}`,
        { type: 'payout', payoutId: payout._id.toString() },
        'alert'
      );
    }
    
    res.json({ success: true, message: 'Payout requested successfully', data: payout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Pricing Templates
const getMyPricingTemplates = async (req, res) => {
  try {
    const templates = await PartnerPricingTemplate.find({ partner: req.partner.id }).sort('-createdAt');
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createPricingTemplate = async (req, res) => {
  try {
    const template = await PartnerPricingTemplate.create({
      partner: req.partner.id,
      ...req.body
    });
    res.json({ success: true, message: 'Template created', data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePricingTemplate = async (req, res) => {
  try {
    const template = await PartnerPricingTemplate.findOneAndUpdate(
      { _id: req.params.id, partner: req.partner.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, message: 'Template updated', data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePricingTemplate = async (req, res) => {
  try {
    await PartnerPricingTemplate.findOneAndDelete({ _id: req.params.id, partner: req.partner.id });
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Promotions/Offers
const getMyPromotions = async (req, res) => {
  try {
    const offers = await Offer.find({ isActive: true }).sort('-createdAt');
    res.json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createPromotion = async (req, res) => {
  try {
    const offer = await Offer.create(req.body);
    res.json({ success: true, message: 'Promotion created', data: offer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Partner: Update booking status
// @route   PUT /api/partner/me/bookings/:id/status
// @access  Partner
const updateMyBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update' });
    }

    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId)
      .populate('station', 'name location city partner')
      .populate('user', 'name email mobile phone');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.station.partner !== req.partner.name) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this booking' });
    }

    booking.status = status;
    await booking.save();

    res.json({ success: true, message: `Booking marked as ${status}`, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update Partner FCM Token
// @route PUT /api/partner/me/fcm-token
// @access Partner
const updateFcmToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'FCM token is required' });
    }

    const partner = await Partner.findById(req.partner.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    partner.fcmToken = token;
    await partner.save();

    res.json({ success: true, message: 'FCM token updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get partner notifications
// @route   GET /api/partner/me/notifications
// @access  Partner
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await PartnerNotification.find({ partner: req.partner._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark partner notifications as read
// @route   PUT /api/partner/me/notifications/read
// @access  Partner
const markNotificationsRead = async (req, res) => {
  try {
    await PartnerNotification.updateMany(
      { partner: req.partner._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Partner: Get unified transactions history
// @route   GET /api/partner/me/transactions
// @access  Partner
const getMyTransactions = async (req, res) => {
  try {
    const { filter = 'All', page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const stations = await Station.find({ partner: req.partner.name });
    const stationIds = stations.map(s => s._id);

    let combined = [];

    // Fetch Bookings (Revenue)
    if (filter === 'All' || filter === 'Revenue') {
      const bookings = await Booking.find({ station: { $in: stationIds }, paymentStatus: 'Paid' });
      bookings.forEach(b => {
        combined.push({
          id: b._id.toString(),
          type: 'Revenue',
          date: b.endTime || b.createdAt,
          title: `Session #${b.bookingId || b._id.toString().substring(0, 8).toUpperCase()}`,
          amount: b.estimatedCost || b.totalAmount || 0,
          isRevenue: true,
          status: b.status,
          sortDate: new Date(b.endTime || b.createdAt).getTime()
        });
      });
    }

    // Fetch Payouts
    if (filter === 'All' || filter === 'Payouts') {
      const payouts = await PartnerPayout.find({ partner: req.partner._id });
      payouts.forEach(p => {
        combined.push({
          id: p._id.toString(),
          type: 'Payout',
          date: p.requestedAt || p.createdAt,
          title: `Payout to Bank (${p.status})`,
          amount: p.amount || 0,
          isRevenue: false,
          status: p.status,
          sortDate: new Date(p.requestedAt || p.createdAt).getTime()
        });
      });
    }

    // Sort descending by date
    combined.sort((a, b) => b.sortDate - a.sortDate);

    // Apply pagination manually after combine
    const total = combined.length;
    const paginatedData = combined.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      data: paginatedData,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Partner: Get complaints
// @route   GET /api/partner/me/complaints
// @access  Partner
const getMyComplaints = async (req, res) => {
  try {
    const { status } = req.query;
    let query = { partner: req.partner._id };
    if (status && status !== 'All') {
      query.status = status;
    }
    const complaints = await PartnerComplaint.find(query).sort({ createdAt: -1 }).populate('station', 'name');
    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Partner: Create a new complaint
// @route   POST /api/partner/me/complaints
// @access  Partner
const createComplaint = async (req, res) => {
  try {
    const { title, category, description, stationId } = req.body;
    if (!title || !category || !description) {
      return res.status(400).json({ message: 'Title, category, and description are required' });
    }
    const complaint = await PartnerComplaint.create({
      partner: req.partner._id,
      station: stationId || null,
      title,
      category,
      description
    });
    res.status(201).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Partner: Get single complaint details
// @route   GET /api/partner/me/complaints/:id
// @access  Partner
const getComplaintDetails = async (req, res) => {
  try {
    const complaint = await PartnerComplaint.findOne({ _id: req.params.id, partner: req.partner._id }).populate('station', 'name');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Partner: Reply to a complaint
// @route   POST /api/partner/me/complaints/:id/reply
// @access  Partner
const replyToComplaint = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Message text is required' });
    
    const complaint = await PartnerComplaint.findOne({ _id: req.params.id, partner: req.partner._id });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.messages.push({
      sender: 'Partner',
      senderName: req.partner.name,
      text
    });
    
    // Auto reopen if closed? (Optional)
    if (complaint.status === 'Closed') complaint.status = 'Open';
    
    await complaint.save();
    res.json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get partner's customer reviews
// @route   GET /api/partner/me/reviews
// @access  Partner
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ partner: req.partner._id })
      .populate('user', 'name profileImage')
      .populate('station', 'name location')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed reports (transactions) for export
// @route   GET /api/partner/me/reports
// @access  Partner
const getMyReports = async (req, res) => {
  try {
    const period = req.query.period || 'This Month';
    
    // Find stations linked to this partner
    const stations = await Station.find({
      $or: [
        { partner: req.partner.name },
        { partnerId: req.partner._id },
        { partner: req.partner._id.toString() },
        { partner: req.partner.companyName }
      ]
    });
    const stationIds = stations.map(s => s._id);

    let query = {};
    if (stationIds.length > 0) {
      query.station = { $in: stationIds };
    }

    const now = new Date();
    let dateFilter = null;

    if (period === 'Today' || period === 'daily' || period === '1d') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      dateFilter = { $gte: startOfDay, $lte: endOfDay };
    } else if (period === 'This Week' || period === 'weekly' || period === '7d') {
      const pastWeek = new Date();
      pastWeek.setDate(pastWeek.getDate() - 7);
      dateFilter = { $gte: pastWeek };
    } else if (period === 'This Month' || period === 'monthly' || period === '30d') {
      const pastMonth = new Date();
      pastMonth.setDate(pastMonth.getDate() - 30);
      dateFilter = { $gte: pastMonth };
    }

    if (dateFilter) {
      query.createdAt = dateFilter;
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name mobile phone email')
      .populate('station', 'name city state')
      .sort({ createdAt: -1 });

    let totalRevenue = 0;
    let totalEnergy = 0;
    let carbonSaved = 0;

    const stationMap = {};

    const reportData = bookings.map(b => {
      const amount = Number(b.estimatedCost || b.totalAmount || b.amount || 0);
      const energy = Number(b.unitsConsumed || b.estimatedEnergy || b.powerConsumed || 0);
      const carbon = Number(b.carbonSavedKg || 0);

      // Sum all revenue & energy for report summary
      totalRevenue += amount;
      totalEnergy += energy;
      carbonSaved += carbon;

      const stId = b.station?._id ? b.station._id.toString() : 'unknown';
      const stName = b.station?.name || 'Unknown Station';
      const stCity = b.station?.city || 'N/A';

      if (!stationMap[stId]) {
        stationMap[stId] = {
          id: stId,
          name: stName,
          city: stCity,
          totalBookings: 0,
          totalEnergy: 0,
          totalRevenue: 0,
        };
      }
      stationMap[stId].totalBookings += 1;
      stationMap[stId].totalEnergy += energy;
      stationMap[stId].totalRevenue += amount;

      return {
        bookingId: b.bookingId || b._id,
        date: b.createdAt,
        stationName: stName,
        customerName: b.user?.name || 'Customer',
        connectorType: b.connectorType || 'CCS2',
        powerConsumed: energy,
        amount: amount,
        status: b.status || 'Confirmed'
      };
    });

    const mostUsedStations = Object.values(stationMap)
      .sort((a, b) => b.totalBookings - a.totalBookings);

    res.json({
      success: true,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalBookings: reportData.length,
        totalEnergy: Math.round(totalEnergy * 100) / 100,
        carbonSaved: Math.round(carbonSaved * 100) / 100,
        period
      },
      mostUsedStations,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  forgotPassword,
  verifyOtp,
  resetPassword,
  registerPartner,
  createPartner,
  getAllPartners,
  updatePartner,
  deletePartner,
  setPartnerCredentials,
  changePartnerPassword,
  getPartnerHistory,
  partnerLogin,
  getMyProfile,
  getMyStations,
  getMyBookings,
  getMyRevenue,
  getMyDashboard,
  addMyStation,
  updateMyStation,
  getStationAnalytics,
  updateMyProfile,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getMyStaff,
  addMyStaff, removeMyStaff, updateMyStaff,
  getMyPayouts, requestPayout,
  getMyPricingTemplates,
  createPricingTemplate,
  updatePricingTemplate,
  deletePricingTemplate,
  getMyPromotions,
  createPromotion,
  updateMyBookingStatus,
  updateFcmToken,
  getMyNotifications,
  markNotificationsRead,
  getMyTransactions,
  getMyComplaints,
  createComplaint,
  getComplaintDetails,
  replyToComplaint,
  getMyReviews,
  getMyReports
};