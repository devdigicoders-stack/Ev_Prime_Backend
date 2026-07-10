const User = require('../models/User');
const Station = require('../models/Station');
const Partner = require('../models/Partner');
const Ticket = require('../models/Ticket');



// @desc    Generate CSV Report
// @route   GET /api/reports/generate
// @access  Admin
const generateReport = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    if (!type) {
      return res.status(400).json({ message: 'Report type is required' });
    }

    let query = {};
    if (startDate && endDate) {
      // Add one day to endDate to include the whole day
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      
      query.createdAt = {
        $gte: new Date(startDate),
        $lt: end
      };
    }

    let reportData = [];
    let filename = `${type}_Report_${new Date().toISOString().split('T')[0]}.csv`;

    switch (type.toLowerCase()) {
      case 'user': {
        const users = await User.find(query).lean();
        reportData = users.map(u => ({
          ID: u._id,
          Name: u.name,
          Email: u.email,
          Phone: u.phone,
          Role: u.role,
          Status: u.status,
          Registered_At: new Date(u.createdAt).toLocaleString()
        }));
        break;
      }
      case 'station': {
        const stations = await Station.find(query).lean();
        reportData = stations.map(s => ({
          ID: s._id,
          Name: s.name,
          City: s.city,
          State: s.state,
          Status: s.status,
          Total_Connectors: s.connectors ? s.connectors.length : 0,
          Created_At: new Date(s.createdAt).toLocaleString()
        }));
        break;
      }
      case 'partner': {
        const partners = await Partner.find(query).lean();
        reportData = partners.map(p => ({
          ID: p._id,
          Name: p.name,
          Company: p.companyName,
          Email: p.email,
          Phone: p.phone,
          Type: p.partnerType,
          Status: p.status,
          Created_At: new Date(p.createdAt).toLocaleString()
        }));
        break;
      }
      case 'ticket': {
         const tickets = await Ticket.find(query).lean();
         reportData = tickets.map(t => ({
           Ticket_ID: t.ticketId,
           User: t.user,
           Subject: t.subject,
           Category: t.category,
           Priority: t.priority,
           Status: t.status,
           Created_At: new Date(t.createdAt).toLocaleString()
         }));
         break;
      }
      default:
        // For modules without DB models yet, return a template
        reportData = [{
           Data: 'Template',
           Status: 'Pending',
           Notes: 'This is a placeholder template for ' + type
        }];
        break;
    }

    res.json({
      filename,
      data: reportData
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error generating report', error: error.message });
  }
};

module.exports = {
  generateReport
};
