const Station = require('../models/Station');

// @desc    Create a new station
// @route   POST /api/station
// @access  Private (Admin)
const createStation = async (req, res) => {
  try {
    const { name, location, city, address, latitude, longitude, powerCapacity, connectors, partner, status } = req.body;

    if (!name || !location || !city || !connectors || !partner) {
      return res.status(400).json({ message: 'Please provide all required fields (name, location, city, connectors, partner)' });
    }

    const stationData = {
      name,
      location,
      city,
      address,
      latitude,
      longitude,
      powerCapacity,
      connectors,
      partner,
      status: status || 'Active'
    };

    if (req.file) {
      stationData.image = `/uploads/${req.file.filename}`;
    }

    const station = await Station.create(stationData);

    res.status(201).json(station);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all stations
// @route   GET /api/station
// @access  Private (Admin)
const getAllStations = async (req, res) => {
  try {
    const stations = await Station.find({}).sort({ createdAt: -1 });
    res.json(stations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single station by ID
// @route   GET /api/station/:id
// @access  Private (Admin)
const getStationById = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (station) {
      res.json(station);
    } else {
      res.status(404).json({ message: 'Station not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a station
// @route   PUT /api/station/:id
// @access  Private (Admin)
const updateStation = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);

    if (station) {
      station.name = req.body.name || station.name;
      station.location = req.body.location || station.location;
      station.city = req.body.city || station.city;
      station.address = req.body.address || station.address;
      station.latitude = req.body.latitude || station.latitude;
      station.longitude = req.body.longitude || station.longitude;
      station.powerCapacity = req.body.powerCapacity || station.powerCapacity;
      station.connectors = req.body.connectors || station.connectors;
      station.partner = req.body.partner || station.partner;
      station.status = req.body.status || station.status;

      if (req.file) {
        station.image = `/uploads/${req.file.filename}`;
      }

      const updatedStation = await station.save();
      res.json(updatedStation);
    } else {
      res.status(404).json({ message: 'Station not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search stations by city / name (public)
// @route   GET /api/station/search
// @access  Public
const searchStations = async (req, res) => {
  try {
    const { q, city, status } = req.query;

    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { address: { $regex: q, $options: 'i' } },
        { city: { $regex: q, $options: 'i' } },
        { partner: { $regex: q, $options: 'i' } }
      ];
    }

    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    }

    if (status) {
      filter.status = status;
    } else {
      filter.status = 'Active'; // Default: only active stations
    }

    const stations = await Station.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: stations.length,
      data: stations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a station
// @route   DELETE /api/station/:id
// @access  Private (Admin)
const deleteStation = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);

    if (station) {
      await Station.deleteOne({ _id: station._id });
      res.json({ message: 'Station removed successfully' });
    } else {
      res.status(404).json({ message: 'Station not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createStation,
  getAllStations,
  getStationById,
  updateStation,
  deleteStation,
  searchStations
};
