const express = require('express');
const router = express.Router();
const { protect, protectUser } = require('../middlewares/authMiddleware');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)),
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Images only'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ─── PRODUCT ROUTES (PUBLIC) ─────────────────────────────────────
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);

// ─── PRODUCT ROUTES (ADMIN) ─────────────────────────────────────
router.get('/admin/products', protect, productController.getAdminProducts);
router.post('/products', protect, upload.array('images', 5), productController.createProduct);
router.put('/products/:id', protect, upload.array('images', 5), productController.updateProduct);
router.delete('/products/:id', protect, productController.deleteProduct);

// ─── ORDER ROUTES (USER) ─────────────────────────────────────────
router.post('/orders/create-razorpay-order', protectUser, orderController.createRazorpayOrder);
router.post('/orders', protectUser, orderController.placeOrder);
router.get('/orders/my', protectUser, orderController.getMyOrders);
router.put('/orders/:id/cancel', protectUser, orderController.cancelOrder);

// ─── ORDER ROUTES (ADMIN) ────────────────────────────────────────
router.get('/admin/orders', protect, orderController.getAllOrders);
router.put('/admin/orders/:id/status', protect, orderController.updateOrderStatus);

module.exports = router;
