const Partner = require('../models/Partner');
const Station = require('../models/Station');
const Booking = require('../models/Booking');
const jwt = require('jsonwebtoken');
const { createAuditLog } = require('./auditController');

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

// @desc    Partner app login
// @route   POST /api/partner/login
// @access  Public
const partnerLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

    const partner = await Partner.findOne({ appUsername: username });
    if (!partner || !partner.hasCredentials) return res.status(401).json({ message: 'Invalid credentials' });
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
    const { status, limit = 50, page = 1 } = req.query;
    const filter = { station: { $in: stationIds } };
    if (status) filter.status = status;
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
    const stations = await Station.find({ partner: req.partner.name });
    const stationIds = stations.map(s => s._id);
    const bookings = await Booking.find({ station: { $in: stationIds }, paymentStatus: 'Paid' });
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.estimatedCost || 0), 0);
    const monthlyRevenue = {};
    bookings.forEach(b => {
      const month = new Date(b.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (b.estimatedCost || 0);
    });
    res.json({ success: true, data: { totalRevenue, monthlyRevenue, totalBookings: bookings.length } });
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
    const recentBookings = await Booking.find({ station: { $in: stationIds } })
      .populate('user', 'name')
      .populate('station', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    res.json({
      success: true,
      data: {
        totalStations: stations.length,
        activeStations,
        totalBookings: allBookings.length,
        todayBookings: todayBookings.length,
        totalRevenue,
        todayRevenue,
        recentBookings,
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
    if (req.file) station.image = `/uploads/${req.file.filename}`;

    const updated = await station.save();
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
