const express = require('express');
const router = express.Router();
const {
  createPartner,
  getAllPartners,
  updatePartner,
  deletePartner
} = require('../controllers/partnerController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createPartner);
router.get('/', protect, getAllPartners);
router.put('/:id', protect, updatePartner);
router.delete('/:id', protect, deletePartner);

module.exports = router;
