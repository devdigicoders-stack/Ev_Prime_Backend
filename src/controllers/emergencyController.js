const Emergency = require('../models/Emergency');

// @desc    Raise an SOS / Emergency request
// @route   POST /api/emergency/sos
// @access  Private
const raiseSOS = async (req, res) => {
  try {
    const { lat, lng, description } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Location is required' });
    }

    const emergency = await Emergency.create({
      user: req.user._id,
      location: { lat, lng },
      description: description || 'Emergency assistance requested'
    });

    res.status(201).json({
      success: true,
      message: 'Emergency SOS raised successfully. Our team will contact you shortly.',
      data: emergency
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  raiseSOS
};
