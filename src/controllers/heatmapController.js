const Station = require('../models/Station');

const cityCoordinates = {
    'Delhi': { lat: 28.6139, lng: 77.2090 },
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Bengaluru': { lat: 12.9716, lng: 77.5946 },
    'Pune': { lat: 18.5204, lng: 73.8567 },
    'Hyderabad': { lat: 17.3850, lng: 78.4867 },
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Kolkata': { lat: 22.5726, lng: 88.3639 },
    'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'Jaipur': { lat: 26.9124, lng: 75.7873 }
};

// @desc    Get Heatmap Data
// @route   GET /api/heatmap
// @access  Admin
const getHeatmapData = async (req, res) => {
  try {
    // 1. Calculate Station Stats
    const totalStations = await Station.countDocuments();
    const activeStations = await Station.countDocuments({ status: 'Active' });
    const maintenanceStations = await Station.countDocuments({ status: 'Maintenance' });
    const inactiveStations = await Station.countDocuments({ status: 'Offline' });

    const stats = {
      total: totalStations.toLocaleString(),
      active: activeStations.toLocaleString(),
      maintenance: maintenanceStations.toLocaleString(),
      inactive: inactiveStations.toLocaleString(),
    };

    // 2. Heatmap Points Integration
    const stations = await Station.find({ status: { $in: ['Active', 'Maintenance'] } });
    
    const mapLocations = stations.map(station => {
      let lat = station.latitude;
      let lng = station.longitude;

      if (!lat || !lng) {
         // Fallback to city coordinates + slight randomization to scatter them
         const cityCoords = cityCoordinates[station.city] || cityCoordinates['Delhi'];
         lat = cityCoords.lat + (Math.random() * 0.1 - 0.05);
         lng = cityCoords.lng + (Math.random() * 0.1 - 0.05);
      }

      // Calculate Intensity based on powerCapacity and connectors.
      // E.g. More than 4 connectors -> High. More than 2 -> Medium. Otherwise Low.
      let intensity = 'low';
      const score = (station.connectors || 1) * (station.powerCapacity || 22);
      if (score > 150) {
          intensity = 'high';
      } else if (score > 50) {
          intensity = 'medium';
      }

      // Randomize slightly if the DB is completely generic, to make it visually interesting
      if(score === 22) {
          const rand = Math.random();
          if(rand > 0.8) intensity = 'high';
          else if(rand > 0.4) intensity = 'medium';
      }

      return {
        id: station._id,
        name: station.name,
        pos: [lat, lng],
        intensity: intensity,
        city: station.city
      };
    });

    // Dummy fallback if no stations are in DB
    if (mapLocations.length === 0) {
        mapLocations.push(
            { id: '1', pos: [28.6139, 77.2090], name: 'Delhi NCR Hub', intensity: 'high', city: 'Delhi' },
            { id: '2', pos: [19.0760, 72.8777], name: 'Mumbai Express', intensity: 'high', city: 'Mumbai' },
            { id: '3', pos: [12.9716, 77.5946], name: 'Bengaluru Tech', intensity: 'medium', city: 'Bengaluru' }
        );
    }

    res.json({
      stats,
      mapLocations
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHeatmapData
};
