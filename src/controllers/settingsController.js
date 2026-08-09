const AdminSettings = require('../models/AdminSettings');
const AdminBilling = require('../models/AdminBilling');

const getSettings = async (req, res) => {
  try {
    const adminId = req.admin._id;

    let settings = await AdminSettings.findOne({ adminId });
    if (!settings) {
      settings = await AdminSettings.create({ adminId });
    }

    let billing = await AdminBilling.findOne({ adminId });
    if (!billing) {
      billing = await AdminBilling.create({
        adminId,
        billingHistory: [
          { date: new Date(new Date().setMonth(new Date().getMonth() - 1)), amount: 45000, status: 'Paid' },
          { date: new Date(new Date().setMonth(new Date().getMonth() - 2)), amount: 45000, status: 'Paid' },
        ]
      });
    }

    res.json({ settings, billing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const updateData = req.body;

    const settings = await AdminSettings.findOneAndUpdate(
      { adminId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBilling = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const updateData = req.body;

    const billing = await AdminBilling.findOneAndUpdate(
      { adminId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json(billing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateApiKey = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const newKey = 'pk_live_' + Math.random().toString(36).substr(2, 20);

    const settings = await AdminSettings.findOneAndUpdate(
      { adminId },
      { $set: { apiProductionKey: newKey } },
      { new: true, upsert: true }
    );

    res.json({ apiProductionKey: settings.apiProductionKey });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPublicSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = {
        phone: '+91 98765 43210',
        contactEmail: 'hello@bharatevprime.com',
        address: 'New Delhi, India',
        facebookUrl: 'https://facebook.com',
        instagramUrl: 'https://instagram.com',
        linkedinUrl: 'https://linkedin.com',
        youtubeUrl: 'https://youtube.com',
        twitterUrl: 'https://twitter.com'
      };
    }
    res.json({
      success: true,
      data: {
        phone: settings.phone || '+91 98765 43210',
        contactEmail: settings.contactEmail || 'hello@bharatevprime.com',
        address: settings.address || 'New Delhi, India',
        facebookUrl: settings.facebookUrl || 'https://facebook.com',
        instagramUrl: settings.instagramUrl || 'https://instagram.com',
        linkedinUrl: settings.linkedinUrl || 'https://linkedin.com',
        youtubeUrl: settings.youtubeUrl || 'https://youtube.com',
        twitterUrl: settings.twitterUrl || 'https://twitter.com',
        tawkEnabled: settings.tawkEnabled !== undefined ? settings.tawkEnabled : true,
        tawkPropertyId: settings.tawkPropertyId || '',
        tawkWidgetId: settings.tawkWidgetId || 'default',
        tawkDirectChatUrl: settings.tawkDirectChatUrl || ''
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  updateBilling,
  generateApiKey,
  getPublicSettings
};
