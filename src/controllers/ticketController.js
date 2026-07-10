const Ticket = require('../models/Ticket');

// @desc    Get all tickets (with optional filters)
// @route   GET /api/tickets
// @access  Admin
const getTickets = async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { ticketId: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { user: { $regex: search, $options: 'i' } }
      ];
    }

    const tickets = await Ticket.find(query).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create a new ticket
// @route   POST /api/tickets
// @access  Public / User
const createTicket = async (req, res) => {
  try {
    const { user, subject, category, priority, message } = req.body;

    const newTicket = new Ticket({
      user,
      subject,
      category,
      priority: priority || 'Medium',
      messages: message ? [{ sender: 'User', senderName: user, text: message }] : []
    });

    const savedTicket = await newTicket.save();
    res.status(201).json(savedTicket);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update ticket status or add reply
// @route   PUT /api/tickets/:id
// @access  Admin
const updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const { status, priority, replyMessage, adminName } = req.body;

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    
    if (replyMessage) {
      ticket.messages.push({
        sender: 'Admin',
        senderName: adminName || 'Admin Team',
        text: replyMessage
      });
      // Optionally auto-update status to In Progress if replied
      if (ticket.status === 'Open') ticket.status = 'In Progress';
    }

    const updatedTicket = await ticket.save();
    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Admin
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    await ticket.deleteOne();
    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getTickets,
  createTicket,
  updateTicket,
  deleteTicket
};
