const express = require('express');
const router = express.Router();
const {
  createPayment,
  getAllPayments,
  deletePayment
} = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createPayment);
router.get('/', protect, getAllPayments);
router.delete('/:id', protect, deletePayment);

module.exports = router;
