const Vehicle = require('../models/Vehicle');

// @desc    Register a new vehicle for a user
// @route   POST /api/vehicle
// @access  Private (User)
exports.registerVehicle = async (req, res) => {
  try {
    const { brand, model, registrationNumber, connectorType, batteryCapacity } = req.body;

    if (!brand || !model || !registrationNumber || !connectorType) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const vehicle = await Vehicle.create({
      user: req.user.id,
      brand,
      model,
      registrationNumber,
      connectorType,
      ...(batteryCapacity && { batteryCapacity: Number(batteryCapacity) }),
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Error registering vehicle:', error);
    res.status(500).json({ success: false, message: 'Server error while registering vehicle' });
  }
};

// @desc    Get all vehicles for logged in user
// @route   GET /api/vehicle
// @access  Private (User)
exports.getUserVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ user: req.user.id });
    res.status(200).json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    console.error('Error fetching user vehicles:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching vehicles' });
  }
};

// @desc    Delete a vehicle
// @route   DELETE /api/vehicle/:id
// @access  Private (User)
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, user: req.user.id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    await Vehicle.deleteOne({ _id: vehicle._id });
    res.json({ success: true, message: 'Vehicle removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
