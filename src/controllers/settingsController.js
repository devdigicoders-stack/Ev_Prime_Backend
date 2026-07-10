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

module.exports = {
  getSettings,
  updateSettings,
  updateBilling,
  generateApiKey
};
