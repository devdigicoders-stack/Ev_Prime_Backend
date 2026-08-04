const express = require('express');
const router = express.Router();
const {
  getPublishedBlogs,
  getBlogBySlug,
  getAllBlogsAdmin,
  createBlog,
  updateBlog,
  togglePublish,
  deleteBlog
} = require('../controllers/blogController');
const { protect } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', getPublishedBlogs);
router.get('/slug/:slug', getBlogBySlug);

// Admin routes
router.get('/admin/all', protect, getAllBlogsAdmin);
router.post('/', protect, createBlog);
router.put('/:id', protect, updateBlog);
router.put('/:id/publish', protect, togglePublish);
router.delete('/:id', protect, deleteBlog);

module.exports = router;
