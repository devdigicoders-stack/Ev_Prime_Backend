const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AdminNotification = require('../models/AdminNotification');
const AdminBroadcast = require('../models/AdminBroadcast');
const PartnerPayout = require('../models/PartnerPayout');
const PartnerComplaint = require('../models/PartnerComplaint');
const notificationService = require('../services/notificationService');
const mongoose = require('mongoose');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new admin
// @route   POST /api/admin/register
// @access  Public
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const adminExists = await Admin.findOne({ email });

    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const admin = await Admin.create({
      name,
      email,
      password
    });

    if (admin) {
      res.status(201).json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        token: generateToken(admin._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid admin data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (admin && (await admin.matchPassword(password))) {
      res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        token: generateToken(admin._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);

    if (admin) {
      res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        description: admin.description,
        phone: admin.phone,
        location: admin.location,
        office: admin.office,
        profileImage: admin.profileImage,
        createdAt: admin.createdAt
      });
    } else {
      res.status(404).json({ message: 'Admin not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private
const updateAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);

    if (admin) {
      admin.name = req.body.name || admin.name;
      admin.email = req.body.email || admin.email;
      admin.role = req.body.role || admin.role;
      admin.description = req.body.description || admin.description;
      admin.phone = req.body.phone || admin.phone;
      admin.location = req.body.location || admin.location;
      admin.office = req.body.office || admin.office;
      
      if (req.file) {
        admin.profileImage = `/uploads/${req.file.filename}`;
      } else if (req.body.profileImage) {
        admin.profileImage = req.body.profileImage;
      }

      const updatedAdmin = await admin.save();

      res.json({
        _id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        description: updatedAdmin.description,
        phone: updatedAdmin.phone,
        location: updatedAdmin.location,
        office: updatedAdmin.office,
        profileImage: updatedAdmin.profileImage,
        token: generateToken(updatedAdmin._id),
      });
    } else {
      res.status(404).json({ message: 'Admin not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change Password
// @route   PUT /api/admin/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    const { oldPassword, newPassword } = req.body;

    if (admin && (await admin.matchPassword(oldPassword))) {
      admin.password = newPassword;
      await admin.save();
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(401).json({ message: 'Invalid old password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send custom notification to users
// @route   POST /api/admin/notifications/send
// @access  Private (Admin)
const sendCustomNotification = async (req, res) => {
  try {
    const { title, body, type, userId } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }

    if (userId && userId.trim() !== '') {
      if (!mongoose.Types.ObjectId.isValid(userId.trim())) {
        return res.status(400).json({ message: 'Invalid Target User ID. Please provide a valid ID or leave it empty.' });
      }
      
      // Send to specific user
      const result = await notificationService.sendToUser(userId.trim(), title, body, {}, type || 'alert');
      
      await AdminBroadcast.create({ title, body, type: type || 'alert', targetUserId: userId.trim() });
      return res.json({ message: 'Notification sent successfully', result });
    } else {
      // Send to all users
      const users = await User.find({}).select('_id');
      const userIds = users.map(u => u._id);
      const result = await notificationService.sendToMultipleUsers(userIds, title, body, {}, type || 'alert');
      
      await AdminBroadcast.create({ title, body, type: type || 'alert' });
      return res.json({ message: 'Notifications sent successfully to all users', result });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get broadcast history
// @route   GET /api/admin/notifications/broadcasts
// @access  Private (Admin)
const getBroadcastHistory = async (req, res) => {
  try {
    const broadcasts = await AdminBroadcast.find({}).populate('targetUserId', 'name email').sort({ createdAt: -1 });
    res.json(broadcasts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a broadcast from history
// @route   DELETE /api/admin/notifications/broadcasts/:id
// @access  Private (Admin)
const deleteBroadcast = async (req, res) => {
  try {
    await AdminBroadcast.findByIdAndDelete(req.params.id);
    res.json({ message: 'Broadcast deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend a broadcast
// @route   POST /api/admin/notifications/broadcasts/:id/resend
// @access  Private (Admin)
const resendBroadcast = async (req, res) => {
  try {
    const broadcast = await AdminBroadcast.findById(req.params.id);
    if (!broadcast) return res.status(404).json({ message: 'Broadcast not found' });

    if (broadcast.targetUserId) {
      const result = await notificationService.sendToUser(broadcast.targetUserId, broadcast.title, broadcast.body, {}, broadcast.type);
      res.json({ message: 'Resent to specific user', result });
    } else {
      const users = await User.find({}).select('_id');
      const userIds = users.map(u => u._id);
      const result = await notificationService.sendToMultipleUsers(userIds, broadcast.title, broadcast.body, {}, broadcast.type);
      res.json({ message: 'Resent to all users', result });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update FCM Token for admin
// @route   POST /api/admin/update-fcm-token
// @access  Private
const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ message: 'fcmToken is required' });
    }

    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    admin.fcmToken = fcmToken;
    await admin.save();
    res.json({ message: 'FCM token updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove FCM Token for admin on logout
// @route   DELETE /api/admin/fcm-token
// @access  Private
const removeFcmToken = async (req, res) => {
  try {
    await Admin.findByIdAndUpdate(req.admin._id, {
      $unset: { fcmToken: 1 }
    });
    res.json({ success: true, message: 'FCM token removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get admin notifications
// @route   GET /api/admin/notifications
// @access  Private
const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await AdminNotification.find().sort({ createdAt: -1 }).limit(100);
    const unreadCount = await AdminNotification.countDocuments({ isRead: false });
    res.json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark admin notifications as read
// @route   PUT /api/admin/notifications/read
// @access  Private
const markNotificationsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    if (notificationIds && notificationIds.length > 0) {
      await AdminNotification.updateMany({ _id: { $in: notificationIds } }, { isRead: true });
    } else {
      await AdminNotification.updateMany({ isRead: false }, { isRead: true });
    }
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllPayouts = async (req, res) => {
  try {
    const payouts = await PartnerPayout.find().populate('partner', 'name email phone').sort('-createdAt');
    res.json({ success: true, data: payouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePayoutStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body; // status can be 'Approved' or 'Rejected'
    const payout = await PartnerPayout.findById(req.params.id);
    if (!payout) return res.status(404).json({ success: false, message: 'Payout request not found' });
    
    payout.status = status;
    if (remarks) payout.remarks = remarks;
    await payout.save();
    
    // Notify Partner
    const title = status === 'Completed' ? 'Payout Completed! 💰' : 'Payout Rejected ❌';
    const body = status === 'Completed' ? `Your withdrawal request for ₹${payout.amount} has been successfully processed.` : `Your withdrawal request for ₹${payout.amount} was rejected. ${remarks ? `Reason: ${remarks}` : ''}`;
    
    await notificationService.sendToPartner(
      payout.partner.toString(),
      title,
      body,
      { payoutId: payout._id.toString() },
      'payout'
    );
    
    res.json({ success: true, message: `Payout request ${status}`, data: payout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Get all partner complaints
// @route   GET /api/admin/partner-complaints
// @access  Admin
const getAllPartnerComplaints = async (req, res) => {
  try {
    const complaints = await PartnerComplaint.find({})
      .populate('partner', 'name email phone')
      .populate('station', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Update partner complaint status
// @route   PUT /api/admin/partner-complaints/:id/status
// @access  Admin
const updatePartnerComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await PartnerComplaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = status;
    await complaint.save();

    // Send Notification to Partner
    await notificationService.sendToPartner(
      complaint.partner,
      'Complaint Status Updated',
      `Your complaint #${complaint.complaintId} status has been updated to ${status}.`,
      { type: 'complaint_update', complaintId: complaint._id.toString() },
      'alert'
    );

    res.json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Reply to partner complaint
// @route   POST /api/admin/partner-complaints/:id/reply
// @access  Admin
const replyToPartnerComplaint = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Message text is required' });

    const complaint = await PartnerComplaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.messages.push({
      sender: 'Admin',
      senderName: req.admin.name || 'Admin',
      text
    });

    if (complaint.status === 'Closed') {
      complaint.status = 'In Progress';
    }

    await complaint.save();

    // Send Notification to Partner
    await notificationService.sendToPartner(
      complaint.partner,
      'New Reply from Admin',
      `Admin replied to your complaint #${complaint.complaintId}.`,
      { type: 'complaint_reply', complaintId: complaint._id.toString() },
      'alert'
    );

    res.json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  sendCustomNotification,
  updateFcmToken,
  removeFcmToken,
  getAdminNotifications,
  markNotificationsRead,
  getBroadcastHistory,
  deleteBroadcast,
  resendBroadcast,
  getAllPayouts,
  updatePayoutStatus,
  getAllPartnerComplaints,
  updatePartnerComplaintStatus,
  replyToPartnerComplaint
};
