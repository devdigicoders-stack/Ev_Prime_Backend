const Partner = require('../models/Partner');
const { createAuditLog } = require('./auditController');

// @desc    Create a new partner
// @route   POST /api/partner
// @access  Admin
const createPartner = async (req, res) => {
  try {
    const { name, contactPerson, email, phone, status, stationsCount } = req.body;

    const partnerExists = await Partner.findOne({ email });
    if (partnerExists) {
      return res.status(400).json({ message: 'Partner with this email already exists' });
    }

    const partner = await Partner.create({
      name,
      contactPerson,
      email,
      phone,
      status: status || 'Active',
      stationsCount: stationsCount || 0
    });

    if (partner) {
      await createAuditLog({
        user: req.admin ? req.admin.name : 'System',
        role: req.admin ? req.admin.role : 'Super Admin',
        action: 'Created',
        module: 'Partner Management',
        details: `Partner ${name} was created successfully.`,
        ip: req.ip
      });
      res.status(201).json(partner);
    } else {
      res.status(400).json({ message: 'Invalid partner data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all partners
// @route   GET /api/partner
// @access  Admin
const getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find({});
    res.json(partners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update partner
// @route   PUT /api/partner/:id
// @access  Admin
const updatePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    const updatedPartner = await Partner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    await createAuditLog({
      user: req.admin ? req.admin.name : 'System',
      role: req.admin ? req.admin.role : 'Super Admin',
      action: 'Updated',
      module: 'Partner Management',
      details: `Partner ${updatedPartner.name} was updated.`,
      ip: req.ip
    });

    res.json(updatedPartner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete partner
// @route   DELETE /api/partner/:id
// @access  Admin
const deletePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    const partnerName = partner.name;
    await partner.deleteOne();

    await createAuditLog({
      user: req.admin ? req.admin.name : 'System',
      role: req.admin ? req.admin.role : 'Super Admin',
      action: 'Deleted',
      module: 'Partner Management',
      details: `Partner ${partnerName} was deleted.`,
      ip: req.ip
    });

    res.json({ message: 'Partner removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPartner,
  getAllPartners,
  updatePartner,
  deletePartner,
};
