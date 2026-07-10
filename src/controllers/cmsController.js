const Banner = require('../models/Banner');
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

module.exports = {
  getBanners,
  addBanner,
  updateBanner,
  deleteBanner,
};
