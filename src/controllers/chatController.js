const ChatMessage = require('../models/ChatMessage');

// @desc    Get chat history between a user (admin) and a partner
// @route   GET /api/chat/:partnerId
// @access  Private (Admin or Partner)
const getChatHistory = async (req, res) => {
  try {
    const { partnerId } = req.params;
    
    // In our simplified model, admin messages are senderModel='User' and receiverId=partnerId
    // Partner messages are senderModel='Partner' and senderId=partnerId
    const messages = await ChatMessage.find({
      $or: [
        { senderId: partnerId },
        { receiverId: partnerId }
      ]
    }).sort({ createdAt: 1 });

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get chat partners list for admin (who has messaged)
// @route   GET /api/chat/partners
// @access  Private (Admin)
const getChatPartners = async (req, res) => {
  try {
    // Find unique partner IDs from messages (both sent and received)
    const senderIds = await ChatMessage.distinct('senderId', { senderModel: 'Partner' });
    const receiverIds = await ChatMessage.distinct('receiverId', { receiverModel: 'Partner' });
    const partnerIds = [...new Set([...senderIds, ...receiverIds])];
    const Partner = require('../models/Partner');
    const partners = await Partner.find({ _id: { $in: partnerIds } }).select('name appUsername email');
    
    res.json({ success: true, data: partners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getChatHistory,
  getChatPartners
};
