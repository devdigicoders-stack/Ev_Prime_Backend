const express = require('express');
const router = express.Router();
const { 
  getTickets, 
  createTicket, 
  updateTicket, 
  deleteTicket
} = require('../controllers/ticketController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, getTickets)
  .post(createTicket); // Often users might create tickets without strict auth in a simple setup, or with user auth.

router.route('/:id')
  .put(protect, updateTicket)
  .delete(protect, deleteTicket);

module.exports = router;
