const express = require('express');
const router = express.Router();
const { protectUser, protect } = require('../middlewares/authMiddleware');
const { getStationPricing, calculateCost, getGlobalPricing, getAllPricing, createPricing, updatePricing, deletePricing, togglePricing } = require('../controllers/pricingController');

// Public routes (Flutter app)
router.get('/global', getGlobalPricing);
router.get('/station/:stationId', getStationPricing);
router.post('/calculate', calculateCost);

// Admin routes
router.get('/admin/all', protect, getAllPricing);
router.post('/admin', protect, createPricing);
router.put('/admin/:id', protect, updatePricing);
router.put('/admin/:id/toggle', protect, togglePricing);
router.delete('/admin/:id', protect, deletePricing);

module.exports = router;
