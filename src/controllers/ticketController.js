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
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const tickets = await Ticket.find(query)
      .populate('user', 'name email mobile')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get logged in user's tickets
// @route   GET /api/tickets/my
// @access  User
const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create a new ticket
// @route   POST /api/tickets
// @access  User
const createTicket = async (req, res) => {
  try {
    const { subject, category, priority, message } = req.body;

    const newTicket = new Ticket({
      user: req.user._id,
      subject,
      category,
      priority: priority || 'Medium',
      messages: message ? [{ sender: 'User', senderName: req.user.name || 'User', text: message }] : []
    });

    const savedTicket = await newTicket.save();
    res.status(201).json(savedTicket);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update ticket status or add reply
// @route   PUT /api/tickets/:id
// @access  Admin & User
const updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user is the owner (if not admin)
    if (req.user && ticket.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { status, priority, replyMessage, adminName } = req.body;

    // Only admin should change status or priority
    if (req.admin) {
      if (status) ticket.status = status;
      if (priority) ticket.priority = priority;
    }

    if (replyMessage) {
      const sender = req.admin ? 'Admin' : 'User';
      const senderName = req.admin ? (adminName || 'Admin Team') : (req.user ? req.user.name : 'User');
      
      ticket.messages.push({
        sender,
        senderName,
        text: replyMessage
      });
      
      // Auto-update status
      if (req.admin && ticket.status === 'Open') ticket.status = 'In Progress';
      if (req.user && ticket.status !== 'Closed') ticket.status = 'Open'; // Re-open if user replies
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
  getMyTickets,
  createTicket,
  updateTicket,
  deleteTicket
};
