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

// @desc    Get active stations along a route within a radius
// @route   GET /api/station/route?srcLat=&srcLng=&destLat=&destLng=&radius=
// @access  Public
const getStationsAlongRoute = async (req, res) => {
  try {
    const { srcLat, srcLng, destLat, destLng, radius = 5 } = req.query;
    if (!srcLat || !srcLng || !destLat || !destLng) {
      return res.status(400).json({ success: false, message: 'srcLat, srcLng, destLat, destLng are required' });
    }

    const aLat = parseFloat(srcLat);
    const aLng = parseFloat(srcLng);
    const bLat = parseFloat(destLat);
    const bLng = parseFloat(destLng);
    const maxRadius = parseFloat(radius);

    const toRad = (d) => (d * Math.PI) / 180;
    const haversine = (lat1, lng1, lat2, lng2) => {
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const pointToSegmentDist = (pLat, pLng) => {
      const dx = bLat - aLat;
      const dy = bLng - aLng;
      if (dx === 0 && dy === 0) return haversine(pLat, pLng, aLat, aLng);
      const t = Math.max(0, Math.min(1, ((pLat - aLat) * dx + (pLng - aLng) * dy) / (dx * dx + dy * dy)));
      return haversine(pLat, pLng, aLat + t * dx, aLng + t * dy);
    };

    const stations = await Station.find({ status: 'Active' });
    const result = [];

    for (const s of stations) {
      if (s.latitude == null || s.longitude == null) continue;
      const distToRoute = pointToSegmentDist(s.latitude, s.longitude);
      if (distToRoute <= maxRadius) {
        const distFromSrc = haversine(aLat, aLng, s.latitude, s.longitude);
        result.push({
          ...s.toObject(),
          distFromSrc: parseFloat(distFromSrc.toFixed(2)),
          distToRoute: parseFloat(distToRoute.toFixed(2))
        });
      }
    }

    result.sort((a, b) => a.distFromSrc - b.distFromSrc);
    res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createStation,
  getAllStations,
  getStationById,
  updateStation,
  deleteStation,
  searchStations,
  getStationsAlongRoute
};
