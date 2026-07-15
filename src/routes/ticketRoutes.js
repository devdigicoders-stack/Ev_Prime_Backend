const express = require('express');
const router = express.Router();
const { 
  getTickets, 
  getMyTickets,
  createTicket, 
  updateTicket, 
  deleteTicket
} = require('../controllers/ticketController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/my').get(protect, getMyTickets);

router.route('/')
  .get(protect, getTickets)
  .post(protect, createTicket);

router.route('/:id')
  .put(protect, updateTicket)
  .delete(protect, deleteTicket);

module.exports = router;
