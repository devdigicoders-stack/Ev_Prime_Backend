const express = require('express');
const router = express.Router();
const { 
  getTickets, 
  getMyTickets,
  createTicket, 
  updateTicket, 
  deleteTicket
} = require('../controllers/ticketController');
const { protect, protectUser, protectAdminOrUser } = require('../middlewares/authMiddleware');

router.route('/my').get(protectUser, getMyTickets);

router.route('/')
  .get(protect, getTickets)
  .post(protectUser, createTicket);

router.route('/:id')
  .put(protectAdminOrUser, updateTicket)
  .delete(protect, deleteTicket);

module.exports = router;
