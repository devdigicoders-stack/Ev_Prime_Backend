const express = require('express');
const router = express.Router();
const { registerVehicle, getUserVehicles, deleteVehicle } = require('../controllers/vehicleController');
const { protectUser } = require('../middlewares/authMiddleware'); 

router.post('/', protectUser, registerVehicle);
router.get('/', protectUser, getUserVehicles);
router.delete('/:id', protectUser, deleteVehicle);

module.exports = router;
