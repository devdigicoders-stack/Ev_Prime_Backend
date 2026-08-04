const Enquiry = require('../models/Enquiry');

// @desc    Submit a new enquiry (General or Partner)
// @route   POST /api/enquiries
// @access  Public
const submitEnquiry = async (req, res) => {
  try {
    const { name, email, phone, subject, message, type, rating, role } = req.body;

    const enquiry = new Enquiry({
      name,
      email,
      phone,
      subject,
      message,
      type: type || 'General',
      rating,
      role
    });

    const savedEnquiry = await enquiry.save();
    res.status(201).json({ success: true, data: savedEnquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get all enquiries (Admin)
// @route   GET /api/enquiries
// @access  Admin
const getEnquiries = async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};
    if (type && type !== 'All') {
      query.type = type;
    }

    const enquiries = await Enquiry.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: enquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get all reviews (admin) with approve/reject ability
// @route   GET /api/enquiries/reviews
// @access  Admin
const getReviews = async (req, res) => {
  try {
    const { status } = req.query; // 'all', 'approved', 'pending'
    let query = { type: 'Review' };
    if (status === 'approved') query.isApproved = true;
    if (status === 'pending') query.isApproved = false;

    const reviews = await Enquiry.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reviews, total: reviews.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get approved reviews (Public) - for website display
// @route   GET /api/enquiries/reviews/public
// @access  Public
const getApprovedReviews = async (req, res) => {
  try {
    const reviews = await Enquiry.find({ type: 'Review', isApproved: true })
      .select('name role rating message createdAt')
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Approve or reject a review
// @route   PUT /api/enquiries/reviews/:id/approve
// @access  Admin
const approveReview = async (req, res) => {
  try {
    const { isApproved } = req.body;
    const review = await Enquiry.findOneAndUpdate(
      { _id: req.params.id, type: 'Review' },
      { isApproved },
      { new: true }
    );
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.status(200).json({ success: true, data: review, message: isApproved ? 'Review approved' : 'Review rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Update enquiry status
// @route   PUT /api/enquiries/:id/status
// @access  Admin
const updateEnquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    enquiry.status = status;
    await enquiry.save();

    res.status(200).json({ success: true, data: enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Delete an enquiry
// @route   DELETE /api/enquiries/:id
// @access  Admin
const deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    await enquiry.deleteOne();
    res.status(200).json({ success: true, message: 'Enquiry deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  submitEnquiry,
  getEnquiries,
  getReviews,
  getApprovedReviews,
  approveReview,
  updateEnquiryStatus,
  deleteEnquiry
};
