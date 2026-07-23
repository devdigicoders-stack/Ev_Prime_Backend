const ConnectorMaster = require('../models/ConnectorMaster');

// @desc    Get all master connectors
// @route   GET /api/connectors
// @access  Public (for partner app and admin)
const getConnectors = async (req, res) => {
  try {
    const connectors = await ConnectorMaster.find({});
    res.json({ success: true, data: connectors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new master connector
// @route   POST /api/connectors
// @access  Admin
const createConnector = async (req, res) => {
  try {
    const connector = await ConnectorMaster.create(req.body);
    res.status(201).json({ success: true, data: connector });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update master connector
// @route   PUT /api/connectors/:id
// @access  Admin
const updateConnector = async (req, res) => {
  try {
    const connector = await ConnectorMaster.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!connector) return res.status(404).json({ success: false, message: 'Connector not found' });
    res.json({ success: true, data: connector });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete master connector
// @route   DELETE /api/connectors/:id
// @access  Admin
const deleteConnector = async (req, res) => {
  try {
    const connector = await ConnectorMaster.findByIdAndDelete(req.params.id);
    if (!connector) return res.status(404).json({ success: false, message: 'Connector not found' });
    res.json({ success: true, message: 'Connector deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getConnectors,
  createConnector,
  updateConnector,
  deleteConnector
};
