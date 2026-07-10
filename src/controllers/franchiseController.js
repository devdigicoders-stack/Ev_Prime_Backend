const Franchise = require('../models/Franchise');

// @desc    Create a new franchise
// @route   POST /api/franchise
// @access  Admin
const createFranchise = async (req, res) => {
  try {
    const { name, owner, location, city, status, stationsCount } = req.body;

    const franchise = await Franchise.create({
      name,
      owner,
      location,
      city,
      status: status || 'Active',
      stationsCount: stationsCount || 0
    });

    if (franchise) {
      res.status(201).json(franchise);
    } else {
      res.status(400).json({ message: 'Invalid franchise data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all franchises
// @route   GET /api/franchise
// @access  Admin
const getAllFranchises = async (req, res) => {
  try {
    const franchises = await Franchise.find({});
    res.json(franchises);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update franchise
// @route   PUT /api/franchise/:id
// @access  Admin
const updateFranchise = async (req, res) => {
  try {
    const franchise = await Franchise.findById(req.params.id);

    if (!franchise) {
      return res.status(404).json({ message: 'Franchise not found' });
    }

    const updatedFranchise = await Franchise.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedFranchise);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete franchise
// @route   DELETE /api/franchise/:id
// @access  Admin
const deleteFranchise = async (req, res) => {
  try {
    const franchise = await Franchise.findById(req.params.id);

    if (!franchise) {
      return res.status(404).json({ message: 'Franchise not found' });
    }

    await franchise.deleteOne();
    res.json({ message: 'Franchise removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createFranchise,
  getAllFranchises,
  updateFranchise,
  deleteFranchise,
};
