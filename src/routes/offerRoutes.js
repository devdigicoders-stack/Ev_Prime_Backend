const express = require('express');
const router = express.Router();
const { getOffers, getAdminOffers, createOffer, updateOffer, deleteOffer } = require('../controllers/offerController');
const { protectUser, protect } = require('../middlewares/authMiddleware');

router.get('/', getOffers);
router.get('/admin', protect, getAdminOffers);
router.post('/', protect, createOffer);
router.put('/:id', protect, updateOffer);
router.delete('/:id', protect, deleteOffer);

module.exports = router;
