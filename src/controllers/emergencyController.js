const Emergency = require('../models/Emergency');

// @desc    Raise SOS
// @route   POST /api/emergency/sos
// @access  User
const raiseSOS = async (req, res) => {
  try {
    const { lat, lng, issueType, description } = req.body;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'Location is required' });

    const emergency = await Emergency.create({
      user: req.user._id,
      location: { lat, lng },
      issueType: issueType || 'Other',
      description: description || 'Emergency assistance requested',
    });

    const populated = await Emergency.findById(emergency._id).populate('user', 'name mobile');

    res.status(201).json({
      success: true,
      message: 'SOS raised successfully. Our team will contact you shortly.',
      data: populated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my emergency requests
// @route   GET /api/emergency/my
// @access  User
const getMyEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: emergencies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel my emergency
// @route   PUT /api/emergency/:id/cancel
// @access  User
const cancelEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findOne({ _id: req.params.id, user: req.user._id });
    if (!emergency) return res.status(404).json({ success: false, message: 'Not found' });
    if (['Resolved', 'Cancelled'].includes(emergency.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${emergency.status} request` });
    }
    emergency.status = 'Cancelled';
    await emergency.save();
    res.json({ success: true, data: emergency });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN ────────────────────────────────────────────────────────

// @desc    Get all emergencies (admin)
// @route   GET /api/emergency/admin/all
// @access  Admin
const getAllEmergencies = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'All') filter.status = status;

    const emergencies = await Emergency.find(filter)
      .populate('user', 'name mobile email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Emergency.countDocuments(filter);
    const stats = {
      total: await Emergency.countDocuments(),
      pending: await Emergency.countDocuments({ status: 'Pending' }),
      assigned: await Emergency.countDocuments({ status: 'Assigned' }),
      inProgress: await Emergency.countDocuments({ status: 'In Progress' }),
      resolved: await Emergency.countDocuments({ status: 'Resolved' }),
    };

    res.json({ success: true, data: emergencies, total, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update emergency status (admin)
// @route   PUT /api/emergency/admin/:id/status
// @access  Admin
const updateEmergencyStatus = async (req, res) => {
  try {
    const { status, assignedTo, adminNote } = req.body;
    const update = { status };
    if (assignedTo !== undefined) update.assignedTo = assignedTo;
    if (adminNote !== undefined) update.adminNote = adminNote;
    if (status === 'Resolved') update.resolvedAt = new Date();

    const emergency = await Emergency.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user', 'name mobile');

    if (!emergency) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: emergency });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { raiseSOS, getMyEmergencies, cancelEmergency, getAllEmergencies, updateEmergencyStatus };
