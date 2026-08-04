const Blog = require('../models/Blog');

// @desc  Get all published blogs (public)
// @route GET /api/blogs
// @access Public
const getPublishedBlogs = async (req, res) => {
  try {
    const { category, limit = 20, page = 1, search } = req.query;
    const query = { isPublished: true };
    if (category && category !== 'All' && category !== 'All Posts') query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const blogs = await Blog.find(query)
      .select('title slug excerpt coverImage category author publishedAt views createdAt tags')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Blog.countDocuments(query);
    res.json({ success: true, data: blogs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single blog by slug (public)
// @route GET /api/blogs/:slug
// @access Public
const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    // Increment views
    blog.views += 1;
    await blog.save();
    res.json({ success: true, data: blog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all blogs for admin (including unpublished)
// @route GET /api/blogs/admin/all
// @access Admin
const getAllBlogsAdmin = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const query = {};
    if (category && category !== 'All') query.category = category;
    if (status === 'published') query.isPublished = true;
    if (status === 'draft') query.isPublished = false;
    if (search) query.title = { $regex: search, $options: 'i' };

    const blogs = await Blog.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: blogs, total: blogs.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create a blog post
// @route POST /api/blogs
// @access Admin
const createBlog = async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, category, tags, author, isPublished } = req.body;
    if (!title || !excerpt || !content) {
      return res.status(400).json({ success: false, message: 'Title, excerpt and content are required' });
    }
    const blog = await Blog.create({
      title, excerpt, content,
      coverImage: coverImage || '',
      category: category || 'EV News',
      tags: tags || [],
      author: author || 'Bharat EV Prime Team',
      isPublished: !!isPublished,
      publishedAt: isPublished ? new Date() : null
    });
    res.status(201).json({ success: true, data: blog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update a blog post
// @route PUT /api/blogs/:id
// @access Admin
const updateBlog = async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, category, tags, author, isPublished } = req.body;
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    blog.title = title ?? blog.title;
    blog.excerpt = excerpt ?? blog.excerpt;
    blog.content = content ?? blog.content;
    blog.coverImage = coverImage ?? blog.coverImage;
    blog.category = category ?? blog.category;
    blog.tags = tags ?? blog.tags;
    blog.author = author ?? blog.author;

    // Handle publish state change
    if (typeof isPublished === 'boolean') {
      if (isPublished && !blog.isPublished) blog.publishedAt = new Date();
      if (!isPublished) blog.publishedAt = null;
      blog.isPublished = isPublished;
    }

    await blog.save();
    res.json({ success: true, data: blog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Toggle publish/unpublish
// @route PUT /api/blogs/:id/publish
// @access Admin
const togglePublish = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    blog.isPublished = !blog.isPublished;
    blog.publishedAt = blog.isPublished ? new Date() : null;
    await blog.save();
    res.json({ success: true, data: blog, message: blog.isPublished ? 'Blog published' : 'Blog unpublished' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete a blog post
// @route DELETE /api/blogs/:id
// @access Admin
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    await blog.deleteOne();
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getPublishedBlogs, getBlogBySlug, getAllBlogsAdmin, createBlog, updateBlog, togglePublish, deleteBlog };
