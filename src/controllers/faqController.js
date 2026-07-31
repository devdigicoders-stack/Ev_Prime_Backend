const FAQ = require('../models/FAQ');

const DEFAULT_FAQS = [
  { question: 'What is Bharat EV Prime?', answer: 'Bharat EV Prime is a comprehensive EV charging network that allows you to find, book, and pay for EV charging sessions across India.', category: 'General', order: 1 },
  { question: 'How do I create an account?', answer: 'You can sign up using your mobile number and verify it with an OTP. Once verified, you can complete your profile details.', category: 'General', order: 2 },
  { question: 'How do I locate a charger?', answer: 'Go to the Map Screen in the app to see all nearby charging stations. You can filter by connector type and availability.', category: 'General', order: 3 },
  { question: 'How do I start charging?', answer: 'Scan the QR code at the station using the app, plug in the connector to your EV, and tap Start Charging.', category: 'Charging', order: 1 },
  { question: 'What if charging stops in between?', answer: 'Check the connection between the charger and your vehicle. You can try restarting the session from the app or contact support.', category: 'Charging', order: 2 },
  { question: 'Can I book a slot in advance?', answer: 'Yes, select a charging station on the map, choose an available time slot, and confirm your booking.', category: 'Charging', order: 3 },
  { question: 'How to cancel a booking?', answer: 'Go to My Bookings, select the upcoming booking, and tap Cancel. A 5% cancellation fee may apply.', category: 'Charging', order: 4 },
  { question: 'How to add money to Wallet?', answer: 'Go to the Wallet section, tap Add Money, enter the amount, and proceed with UPI, Credit/Debit Card, or Netbanking.', category: 'Payments', order: 1 },
  { question: 'Are there any hidden charges?', answer: 'No, all charges including energy cost and time-based fees are transparently shown before you start charging.', category: 'Payments', order: 2 },
  { question: 'How do I get a refund?', answer: 'For failed transactions, the amount is automatically refunded to your original payment method within 3-5 business days.', category: 'Payments', order: 3 },
];

// @desc  Get all active FAQs (public)
// @route GET /api/faq
// @access Public
const getFAQs = async (req, res) => {
  try {
    let faqs = await FAQ.find({ isActive: true }).sort({ category: 1, order: 1, createdAt: 1 });

    // Auto-seed defaults on first load
    if (faqs.length === 0) {
      await FAQ.insertMany(DEFAULT_FAQS);
      faqs = await FAQ.find({ isActive: true }).sort({ category: 1, order: 1 });
    }

    // Group by category
    const grouped = {};
    for (const faq of faqs) {
      if (!grouped[faq.category]) grouped[faq.category] = [];
      grouped[faq.category].push({ _id: faq._id, question: faq.question, answer: faq.answer, order: faq.order });
    }

    res.json({ success: true, data: grouped, total: faqs.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all FAQs for admin (including inactive)
// @route GET /api/faq/admin
// @access Admin
const getAllFAQsAdmin = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category && category !== 'All' ? { category } : {};
    const faqs = await FAQ.find(filter).sort({ category: 1, order: 1, createdAt: 1 });
    res.json({ success: true, data: faqs, total: faqs.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create FAQ
// @route POST /api/faq
// @access Admin
const createFAQ = async (req, res) => {
  try {
    const { question, answer, category, order } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Question and answer are required' });
    }
    const faq = await FAQ.create({ question, answer, category: category || 'General', order: order || 0 });
    res.status(201).json({ success: true, data: faq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update FAQ
// @route PUT /api/faq/:id
// @access Admin
const updateFAQ = async (req, res) => {
  try {
    const { question, answer, category, order, isActive } = req.body;
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      { question, answer, category, order, isActive },
      { new: true, runValidators: true }
    );
    if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' });
    res.json({ success: true, data: faq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete FAQ
// @route DELETE /api/faq/:id
// @access Admin
const deleteFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' });
    res.json({ success: true, message: 'FAQ deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getFAQs, getAllFAQsAdmin, createFAQ, updateFAQ, deleteFAQ };
