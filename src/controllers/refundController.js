const Refund = require('../models/Refund');
const { createAuditLog } = require('./auditController');

// @desc    Create a new refund request (For Testing/App)
// @route   POST /api/refund
// @access  Admin
const createRefund = async (req, res) => {
  try {
    const { refundId, user, amount, reason, status } = req.body;

    const refund = await Refund.create({
      refundId,
      user,
      amount,
      reason,
      status: status || 'Pending'
    });

    if (refund) {
      await createAuditLog({
        user: req.admin ? req.admin.name : 'System',
        role: req.admin ? req.admin.role : 'Super Admin',
        action: 'Created',
        module: 'Refund Management',
        details: `Refund request ${refundId} created.`,
        ip: req.ip
      });
      res.status(201).json(refund);
    } else {
      res.status(400).json({ message: 'Invalid refund data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all refunds
// @route   GET /api/refund
// @access  Admin
const getAllRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find({}).sort({ createdAt: -1 });
    res.json(refunds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update refund status
// @route   PUT /api/refund/:id
// @access  Admin
const updateRefundStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Approved', 'Pending', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const refund = await Refund.findById(req.params.id);

    if (refund) {
      refund.status = status;
      const updatedRefund = await refund.save();

      await createAuditLog({
        user: req.admin ? req.admin.name : 'System',
        role: req.admin ? req.admin.role : 'Super Admin',
        action: 'Updated',
        module: 'Refund Management',
        details: `Refund request ${updatedRefund.refundId} status updated to ${status}.`,
        ip: req.ip
      });

      res.json(updatedRefund);
    } else {
      res.status(404).json({ message: 'Refund not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete refund
// @route   DELETE /api/refund/:id
// @access  Admin
const deleteRefund = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id);

    if (!refund) {
      return res.status(404).json({ message: 'Refund not found' });
    }

    const refundId = refund.refundId;
    await refund.deleteOne();

    await createAuditLog({
      user: req.admin ? req.admin.name : 'System',
      role: req.admin ? req.admin.role : 'Super Admin',
      action: 'Deleted',
      module: 'Refund Management',
      details: `Refund request ${refundId} was deleted.`,
      ip: req.ip
    });

    res.json({ message: 'Refund removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRefund,
  getAllRefunds,
  updateRefundStatus,
  deleteRefund
};
