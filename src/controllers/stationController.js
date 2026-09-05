const mongoose = require('mongoose');
const Station = require('../models/Station');
const Partner = require('../models/Partner');
const notificationService = require('../services/notificationService');

// @desc    Create a new station
// @route   POST /api/station
// @access  Private (Admin)
const createStation = async (req, res) => {
  try {
    const {
      name, location, city, state, address, latitude, longitude,
      powerCapacity, connectors, partner, status, connectorTypes,
      amenities, openHours
    } = req.body;

    if (!name || !location || !city || !connectors || !partner) {
      return res.status(400).json({ message: 'Please provide all required fields (name, location, city, connectors, partner)' });
    }

    // Parse connectorTypes if sent as string (FormData)
    let parsedConnectorTypes = [];
    if (connectorTypes) {
      try {
        parsedConnectorTypes = typeof connectorTypes === 'string' ? JSON.parse(connectorTypes) : connectorTypes;
      } catch (e) { parsedConnectorTypes = []; }
    }

    const stationData = {
      name, location, city, state: state || req.body.state, address, latitude, longitude,
      powerCapacity, connectors, partner,
      status: status || 'Active',
      connectorTypes: parsedConnectorTypes,
      amenities: amenities ? (typeof amenities === 'string' ? JSON.parse(amenities) : amenities) : [],
      openHours: openHours || '24/7',
      createdBy: req.admin ? req.admin._id : null
    };

    if (req.file) stationData.image = `/uploads/${req.file.filename}`;

    const station = await Station.create(stationData);

    // Update partner's stationsCount
    const Partner = require('../models/Partner');
    await Partner.findOneAndUpdate({ name: partner }, { $inc: { stationsCount: 1 } });

    // Notify all users about the new station
    await notificationService.sendToAllUsers(
      'New Charging Station! 🔋',
      `${station.name} is now live in ${station.city}. Charge up your EV now!`,
      { stationId: station._id.toString() },
      'promo'
    );

    res.status(201).json(station);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all stations
// @route   GET /api/station
// @access  Public / Private (Admin)
const getAllStations = async (req, res) => {
  try {
    let query = {};
    if (req.admin && req.admin.adminType === 'subadmin') {
      query.createdBy = req.admin._id;
    }
    const stations = await Station.find(query).sort({ createdAt: -1 }).lean();

    // Resolve partner names if partner field is an ObjectId
    const partnerIds = stations
      .map(s => s.partner)
      .filter(p => p && mongoose.Types.ObjectId.isValid(p));

    const partners = await Partner.find({ _id: { $in: partnerIds } }, 'name').lean();
    const partnerMap = {};
    partners.forEach(p => {
      partnerMap[p._id.toString()] = p.name;
    });

    const formattedStations = stations.map(s => {
      let partnerDisplayName = s.partner;
      if (s.partner && partnerMap[s.partner.toString()]) {
        partnerDisplayName = partnerMap[s.partner.toString()];
      } else if (s.partner && mongoose.Types.ObjectId.isValid(s.partner)) {
        partnerDisplayName = 'Bharat EV Partner';
      }
      return {
        ...s,
        partner: partnerDisplayName || 'Bharat EV Prime'
      };
    });

    res.json(formattedStations);
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
    if (!station) return res.status(404).json({ message: 'Station not found' });

    const oldStatus = station.status;
    
    const fields = ['name','location','city','address','latitude','longitude','powerCapacity','connectors','partner','status','openHours'];
    fields.forEach(f => { if (req.body[f] !== undefined) station[f] = req.body[f]; });

    const newStatus = station.status;

    // Instant notification logic
    if (oldStatus !== 'Offline' && newStatus === 'Offline') {
      const Partner = require('../models/Partner');
      const partnerDoc = await Partner.findOne({ name: station.partner });
      if (partnerDoc) {
        await notificationService.sendToPartner(
          partnerDoc._id.toString(),
          'Station Offline 🔴',
          `Station ${station.name} has just gone offline.`,
          'alert'
        );
      }
      station.offlineNotificationSent = true;
    } else if (oldStatus === 'Offline' && newStatus !== 'Offline') {
      station.offlineNotificationSent = false;
    }

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
    res.json(updated);
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

    if (q && q.trim()) {
      const stopWords = new Set([
        'me', 'mai', 'main', 'in', 'pe', 'par', 'ka', 'ki', 'ke', 'ko', 'se', 'hai', 'hain', 'ho',
        'near', 'nearby', 'paas', 'pass', 'batao', 'bataiye', 'dikhao', 'dikhaye', 'show', 'find',
        'search', 'kahan', 'kahahan', 'where', 'is', 'are', 'the', 'a', 'an', 'for', 'of', 'and', 'or',
        'with', 'to', 'from', 'location', 'locations', 'area', 'city', 'place', 'bhai',
        'charging', 'charginf', 'chargin', 'chargng',
        'station', 'stations', 'stn', 'stasion',
        'charger', 'chargers', 'charget',
        'ev', 'evs', 'point', 'points', 'spot', 'spots', 'hub', 'hubs'
      ]);

      const rawWords = q.trim().split(/\s+/).filter(Boolean);
      const sigWords = rawWords.filter(w => !stopWords.has(w.toLowerCase()));
      const wordsToSearch = sigWords.length > 0 ? sigWords : rawWords;

      filter.$and = wordsToSearch.map(word => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return {
          $or: [
            { name: { $regex: escaped, $options: 'i' } },
            { location: { $regex: escaped, $options: 'i' } },
            { address: { $regex: escaped, $options: 'i' } },
            { city: { $regex: escaped, $options: 'i' } },
            { state: { $regex: escaped, $options: 'i' } },
            { partner: { $regex: escaped, $options: 'i' } },
            { chargeType: { $regex: escaped, $options: 'i' } }
          ]
        };
      });
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
      // Update partner's stationsCount
      const Partner = require('../models/Partner');
      await Partner.findOneAndUpdate({ name: station.partner }, { $inc: { stationsCount: -1 } });

      await station.deleteOne();
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
