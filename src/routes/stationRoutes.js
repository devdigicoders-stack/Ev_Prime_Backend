const express = require('express');
const router = express.Router();
const {
  createStation,
  getAllStations,
  getStationById,
  updateStation,
  deleteStation,
  searchStations
} = require('../controllers/stationController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.route('/')
  .post(protect, upload.single('image'), createStation)
  .get(getAllStations);

// Search route must come BEFORE /:id route
router.get('/search', searchStations);

router.route('/:id')
  .get(protect, getStationById)
  .put(protect, upload.single('image'), updateStation)
  .delete(protect, deleteStation);

module.exports = router;
