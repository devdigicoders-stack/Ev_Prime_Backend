const Offer = require('../models/Offer');

// @desc    Get all active offers (Public/User)
// @route   GET /api/offers
// @access  Public
const getOffers = async (req, res) => {
  try {
    let offers = await Offer.find({ isActive: true, validUntil: { $gte: new Date() } }).sort({ createdAt: -1 });

    // Seed default offers if empty for testing
    if (offers.length === 0) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      await Offer.insertMany([
        { title: 'Welcome Bonus', description: 'Get 20% off on your first charge.', code: 'WELCOME20', discountType: 'PERCENTAGE', discountValue: 20, validUntil: nextMonth },
        { title: 'Weekend Special', description: 'Flat ₹50 off on charging this weekend.', code: 'WEEKEND50', discountType: 'FLAT', discountValue: 50, validUntil: nextMonth },
        { title: 'Mega Saving', description: 'Get 10% off up to ₹100.', code: 'SAVE10', discountType: 'PERCENTAGE', discountValue: 10, validUntil: nextMonth }
      ]);
      offers = await Offer.find({ isActive: true, validUntil: { $gte: new Date() } }).sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      data: offers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get all offers (Admin)
// @route   GET /api/offers/admin
// @access  Private/Admin
const getAdminOffers = async (req, res) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Create a new offer
// @route   POST /api/offers
// @access  Private/Admin
const createOffer = async (req, res) => {
  try {
    const { title, description, code, discountType, discountValue, validUntil, isActive } = req.body;

    const offer = await Offer.create({
      title,
      description,
      code,
      discountType,
      discountValue,
      validUntil,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Update an offer
// @route   PUT /api/offers/:id
// @access  Private/Admin
const updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }
    res.json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Delete an offer
// @route   DELETE /api/offers/:id
// @access  Private/Admin
const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }
    res.json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getOffers,
  getAdminOffers,
  createOffer,
  updateOffer,
  deleteOffer
};
