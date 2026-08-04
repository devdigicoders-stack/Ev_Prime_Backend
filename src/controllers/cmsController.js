const Banner = require('../models/Banner');
const TeamMember = require('../models/TeamMember');
const fs = require('fs');
const path = require('path');

// @desc    Get all banners
// @route   GET /api/cms
// @access  Admin
const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ priority: 1, createdAt: -1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add a banner
// @route   POST /api/cms
// @access  Admin
const addBanner = async (req, res) => {
  try {
    const { title, type, url, status, priority } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Banner image is required' });
    }

    // Store the relative path so the frontend can access it via /uploads/filename
    const imageUrl = `/uploads/${req.file.filename}`;

    const banner = new Banner({
      title,
      type,
      url,
      status,
      priority: parseInt(priority) || 1,
      imageUrl,
    });

    const createdBanner = await banner.save();
    res.status(201).json(createdBanner);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a banner
// @route   DELETE /api/cms/:id
// @access  Admin
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (banner) {
      // Attempt to delete the physical image file
      const filePath = path.join(__dirname, '../../', banner.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await banner.deleteOne();
      res.json({ message: 'Banner removed' });
    } else {
      res.status(404).json({ message: 'Banner not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update a banner
// @route   PUT /api/cms/:id
// @access  Admin
const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (banner) {
      banner.title = req.body.title || banner.title;
      banner.type = req.body.type || banner.type;
      banner.url = req.body.url || banner.url;
      banner.status = req.body.status || banner.status;
      banner.priority = req.body.priority ? parseInt(req.body.priority) : banner.priority;

      // Update image if a new one is uploaded
      if (req.file) {
        // Delete old image
        const oldFilePath = path.join(__dirname, '../../', banner.imageUrl);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
        banner.imageUrl = `/uploads/${req.file.filename}`;
      }

      const updatedBanner = await banner.save();
      res.json(updatedBanner);
    } else {
      res.status(404).json({ message: 'Banner not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const ChargingSolution = require('../models/ChargingSolution');

// @desc    Get all charging solutions
// @route   GET /api/cms/solutions
// @access  Public
const getChargingSolutions = async (req, res) => {
  try {
    const solutions = await ChargingSolution.find().sort({ createdAt: -1 });
    res.json(solutions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add a charging solution
// @route   POST /api/cms/solutions
// @access  Admin
const addChargingSolution = async (req, res) => {
  try {
    const { title, description, link, isActive } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Solution image is required' });
    }

    const image = `/uploads/${req.file.filename}`;

    const solution = new ChargingSolution({
      title,
      description,
      image,
      link: link || '/download-app',
      isActive: isActive !== undefined ? isActive : true,
    });

    const createdSolution = await solution.save();
    res.status(201).json(createdSolution);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update a charging solution
// @route   PUT /api/cms/solutions/:id
// @access  Admin
const updateChargingSolution = async (req, res) => {
  try {
    const solution = await ChargingSolution.findById(req.params.id);

    if (solution) {
      solution.title = req.body.title || solution.title;
      solution.description = req.body.description || solution.description;
      solution.link = req.body.link !== undefined ? req.body.link : solution.link;
      solution.isActive = req.body.isActive !== undefined ? req.body.isActive : solution.isActive;

      if (req.file) {
        const oldFilePath = path.join(__dirname, '../../', solution.image);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
        solution.image = `/uploads/${req.file.filename}`;
      }

      const updatedSolution = await solution.save();
      res.json(updatedSolution);
    } else {
      res.status(404).json({ message: 'Solution not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a charging solution
// @route   DELETE /api/cms/solutions/:id
// @access  Admin
const deleteChargingSolution = async (req, res) => {
  try {
    const solution = await ChargingSolution.findById(req.params.id);

    if (solution) {
      const filePath = path.join(__dirname, '../../', solution.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await solution.deleteOne();
      res.json({ message: 'Solution removed' });
    } else {
      res.status(404).json({ message: 'Solution not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// --- TEAM MEMBERS ---

// @desc    Get all team members
// @route   GET /api/cms/team
// @access  Public
const getTeamMembers = async (req, res) => {
  try {
    const team = await TeamMember.find().sort({ order: 1, createdAt: 1 });
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Add a team member
// @route   POST /api/cms/team
// @access  Admin
const addTeamMember = async (req, res) => {
  try {
    const { name, role, linkedin, twitter, email, order } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Team member image is required' });
    }

    const image = `/uploads/${req.file.filename}`;

    const member = new TeamMember({
      name,
      role,
      image,
      socials: { linkedin, twitter, email },
      order: order ? parseInt(order) : 0
    });

    const createdMember = await member.save();
    res.status(201).json(createdMember);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update a team member
// @route   PUT /api/cms/team/:id
// @access  Admin
const updateTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);

    if (member) {
      member.name = req.body.name || member.name;
      member.role = req.body.role || member.role;
      member.order = req.body.order !== undefined ? parseInt(req.body.order) : member.order;
      
      if (req.body.linkedin !== undefined) member.socials.linkedin = req.body.linkedin;
      if (req.body.twitter !== undefined) member.socials.twitter = req.body.twitter;
      if (req.body.email !== undefined) member.socials.email = req.body.email;

      if (req.file) {
        const oldFilePath = path.join(__dirname, '../../', member.image);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
        member.image = `/uploads/${req.file.filename}`;
      }

      const updatedMember = await member.save();
      res.json(updatedMember);
    } else {
      res.status(404).json({ message: 'Team member not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a team member
// @route   DELETE /api/cms/team/:id
// @access  Admin
const deleteTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);

    if (member) {
      const filePath = path.join(__dirname, '../../', member.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await member.deleteOne();
      res.json({ message: 'Team member removed' });
    } else {
      res.status(404).json({ message: 'Team member not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getBanners,
  addBanner,
  updateBanner,
  deleteBanner,
  getChargingSolutions,
  addChargingSolution,
  updateChargingSolution,
  deleteChargingSolution,
  getTeamMembers,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember
};
