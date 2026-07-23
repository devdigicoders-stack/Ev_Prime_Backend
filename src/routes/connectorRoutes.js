const express = require('express');
const router = express.Router();
const { getConnectors, createConnector, updateConnector, deleteConnector } = require('../controllers/connectorMasterController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', getConnectors); // Public for partner app
router.post('/', protect, createConnector); // Admin only
router.put('/:id', protect, updateConnector); // Admin only
router.delete('/:id', protect, deleteConnector); // Admin only

module.exports = router;
