const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

// @desc  Get all active products (user)
// @route GET /api/market/products
const getProducts = async (req, res) => {
  try {
    const { category, search, featured } = req.query;
    const filter = { isActive: true };
    if (category && category !== 'All') filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const products = await Product.find(filter).sort({ isFeatured: -1, createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single product
// @route GET /api/market/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create product (admin)
// @route POST /api/market/products
const createProduct = async (req, res) => {
  try {
    const { name, description, price, mrp, category, stock, isActive, isFeatured, tags } = req.body;
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    const product = await Product.create({
      name, description,
      price: Number(price),
      mrp: Number(mrp),
      category, stock: Number(stock) || 0,
      isActive: isActive !== 'false',
      isFeatured: isFeatured === 'true',
      images,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
    });

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update product (admin)
// @route PUT /api/market/products/:id
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, mrp, category, stock, isActive, isFeatured, tags } = req.body;
    const update = {
      name, description,
      price: Number(price),
      mrp: Number(mrp),
      category,
      stock: Number(stock),
      isActive: isActive !== 'false' && isActive !== false,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : [],
    };

    if (req.files && req.files.length > 0) {
      update.images = req.files.map(f => `/uploads/${f.filename}`);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete product (admin)
// @route DELETE /api/market/products/:id
const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all products for admin
// @route GET /api/market/admin/products
const getAdminProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};
    if (category && category !== 'All') filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getAdminProducts };
