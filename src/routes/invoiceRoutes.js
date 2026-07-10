const express = require('express');
const router = express.Router();
const { getInvoice, getInvoicePdf, getAllInvoicesAdmin } = require('../controllers/invoiceController');
const { protect, protectUser } = require('../middlewares/authMiddleware');

router.get('/admin/all', protect, getAllInvoicesAdmin);
router.get('/:bookingId/pdf', protectUser, getInvoicePdf);
router.get('/:bookingId', protectUser, getInvoice);

module.exports = router;
