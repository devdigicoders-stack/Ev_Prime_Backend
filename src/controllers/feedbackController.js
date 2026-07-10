const Feedback = require('../models/Feedback');

// Submit feedback
const submitFeedback = async (req, res) => {
  try {
    const { type, rating, title, comment, stationId, productId, orderId } = req.body;
    if (!type || !rating || !comment) return res.status(400).json({ success: false, message: 'type, rating, comment required' });

    const feedback = await Feedback.create({
      user: req.user._id, type, rating, title: title || '', comment,
      stationId: stationId || null,
      productId: productId || null,
      orderId: orderId || null,
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Get my feedback
const getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: feedback });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Get public feedback (all types or filtered)
const getPublicFeedback = async (req, res) => {
  try {
    const { type, limit = 20 } = req.query;
    const filter = { isPublic: true };
    if (type) filter.type = type;

    const feedback = await Feedback.find(filter)
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const matchFilter = { isPublic: true };
    if (type) matchFilter.type = type;

    const stats = await Feedback.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, avg: { $avg: '$rating' }, total: { $sum: 1 },
        r5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        r4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        r3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        r2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        r1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
      }},
    ]);

    res.json({ success: true, data: feedback, stats: stats[0] || { avg: 0, total: 0, r5: 0, r4: 0, r3: 0, r2: 0, r1: 0 } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Mark helpful
const markHelpful = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, { $inc: { helpfulCount: 1 } }, { new: true });
    if (!feedback) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: feedback });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Admin: get all feedback
const getAllFeedback = async (req, res) => {
  try {
    const { type, rating, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type && type !== 'All') filter.type = type;
    if (rating) filter.rating = Number(rating);

    const feedback = await Feedback.find(filter)
      .populate('user', 'name mobile email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Feedback.countDocuments(filter);
    const stats = await Feedback.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' }, total: { $sum: 1 },
        app: { $sum: { $cond: [{ $eq: ['$type', 'app'] }, 1, 0] } },
        station: { $sum: { $cond: [{ $eq: ['$type', 'station'] }, 1, 0] } },
        product: { $sum: { $cond: [{ $eq: ['$type', 'product'] }, 1, 0] } },
        support: { $sum: { $cond: [{ $eq: ['$type', 'support'] }, 1, 0] } },
      }},
    ]);

    res.json({ success: true, data: feedback, total, stats: stats[0] || {} });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Admin: reply to feedback
const replyFeedback = async (req, res) => {
  try {
    const { adminReply } = req.body;
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { adminReply, repliedAt: new Date() },
      { new: true }
    ).populate('user', 'name mobile');
    if (!feedback) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: feedback });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Admin: toggle visibility
const toggleVisibility = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ success: false, message: 'Not found' });
    feedback.isPublic = !feedback.isPublic;
    await feedback.save();
    res.json({ success: true, data: feedback });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Admin: delete feedback
const deleteFeedback = async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { submitFeedback, getMyFeedback, getPublicFeedback, markHelpful, getAllFeedback, replyFeedback, toggleVisibility, deleteFeedback };
