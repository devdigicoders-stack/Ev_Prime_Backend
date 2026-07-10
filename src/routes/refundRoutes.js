const express = require('express');
const router = express.Router();
const {
  createRefund,
  getAllRefunds,
  updateRefundStatus,
  deleteRefund
} = require('../controllers/refundController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createRefund);
router.get('/', protect, getAllRefunds);
router.put('/:id', protect, updateRefundStatus);
router.delete('/:id', protect, deleteRefund);

module.exports = router;
