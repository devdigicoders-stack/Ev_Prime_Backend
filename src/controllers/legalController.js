const LegalDocument = require('../models/LegalDocument');

const DEFAULT_PRIVACY = `1. Introduction
Bharat EV Prime Pvt. Ltd. ("we", "our", or "us") operates the Bharat EV Prime mobile application. This Privacy Policy informs you of our policies regarding the collection, use, and disclosure of personal data when you use our App.

2. Information We Collect
We collect account information (name, mobile, email), vehicle details, GPS location (only when app is in use), payment transaction history, and app usage data.

3. How We Use Your Information
We use your data to process bookings, manage wallet transactions, show nearby stations, send booking confirmations, detect fraud, and improve the app.

4. Information Sharing
We do NOT sell your personal data. We share data only with service providers (Razorpay, Firebase) and when required by law.

5. Data Security
All data is encrypted via SSL/TLS. Payment data is handled by PCI-DSS compliant Razorpay. Data is retained as per legal requirements.

6. Your Rights
You may access, correct, or delete your data via Profile Settings. Contact privacy@bharatevprime.com for requests.

7. Contact Us
Email: privacy@bharatevprime.com | Phone: 1800-XXX-XXXX`;

const DEFAULT_TERMS = `1. Acceptance of Terms
By using the Bharat EV Prime app, you agree to these Terms & Conditions. If you do not agree, please do not use the app.

2. Use of Service
You must be 18+ to use this app. You agree to provide accurate information and not misuse the platform.

3. Bookings & Payments
All bookings are subject to station availability. Payments are processed via Razorpay. A 5% cancellation fee applies.

4. Wallet
Wallet balance is non-transferable and non-refundable except under cancellation policy.

5. Marketplace
Products are sold by verified sellers. Bharat EV Prime acts as a platform facilitator only.

6. Rewards Program
Reward points are non-transferable and have no cash value except as discounts on bookings.

7. Limitation of Liability
Bharat EV Prime is not liable for station downtime, third-party service failures, or indirect damages.

8. Contact Us
Email: support@bharatevprime.com | Phone: 1800-XXX-XXXX`;

// @desc  Get a legal document by type (public)
// @route GET /api/legal/:type
// @access Public
const getLegalDocument = async (req, res) => {
  try {
    const { type } = req.params;
    if (!['privacy_policy', 'terms_conditions'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid document type' });
    }

    let doc = await LegalDocument.findOne({ type });

    // Auto-seed defaults if not in DB
    if (!doc) {
      doc = await LegalDocument.create({
        type,
        title: type === 'privacy_policy' ? 'Privacy Policy' : 'Terms & Conditions',
        content: type === 'privacy_policy' ? DEFAULT_PRIVACY : DEFAULT_TERMS,
        lastUpdated: new Date(),
      });
    }

    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update a legal document (admin only)
// @route PUT /api/legal/:type
// @access Admin
const updateLegalDocument = async (req, res) => {
  try {
    const { type } = req.params;
    const { content, title } = req.body;

    if (!['privacy_policy', 'terms_conditions'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid document type' });
    }
    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const doc = await LegalDocument.findOneAndUpdate(
      { type },
      { content, title: title || (type === 'privacy_policy' ? 'Privacy Policy' : 'Terms & Conditions'), lastUpdated: new Date() },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: doc, message: 'Document updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getLegalDocument, updateLegalDocument };
