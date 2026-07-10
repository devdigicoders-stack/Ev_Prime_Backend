const News = require('../models/News');
const fs = require('fs');
const path = require('path');

// @desc    Get all published news (for app users)
// @route   GET /api/news
// @access  Private (user)
const getPublishedNews = async (req, res) => {
  try {
    const news = await News.find({ isPublished: true }).sort({ createdAt: -1 }).limit(10);
    res.status(200).json({ success: true, count: news.length, data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all news (for admin)
// @route   GET /api/news/admin
// @access  Private (admin)
const getAllNews = async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: news.length, data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create news article (with optional image upload)
// @route   POST /api/news
// @access  Private (admin)
const createNews = async (req, res) => {
  try {
    const { title, summary, content, category, source, isPublished } = req.body;
    if (!title || !summary) {
      return res.status(400).json({ success: false, message: 'Title and summary are required' });
    }
    // If file uploaded, build server path; otherwise use imageUrl from body
    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : (req.body.imageUrl || null);

    const news = await News.create({ title, summary, content, imageUrl, category, source, isPublished });
    res.status(201).json({ success: true, data: news, message: 'News article created successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update news article (with optional image upload)
// @route   PUT /api/news/:id
// @access  Private (admin)
const updateNews = async (req, res) => {
  try {
    const existing = await News.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'News not found' });

    const updateData = { ...req.body };

    if (req.file) {
      // Delete old image from disk if it was a local upload
      if (existing.imageUrl && existing.imageUrl.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '../../', existing.imageUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const news = await News.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: news, message: 'News updated successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete news article
// @route   DELETE /api/news/:id
// @access  Private (admin)
const deleteNews = async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) return res.status(404).json({ success: false, message: 'News not found' });
    // Delete image from disk if local
    if (news.imageUrl && news.imageUrl.startsWith('/uploads/')) {
      const imgPath = path.join(__dirname, '../../', news.imageUrl);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    res.status(200).json({ success: true, message: 'News deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { getPublishedNews, getAllNews, createNews, updateNews, deleteNews };
