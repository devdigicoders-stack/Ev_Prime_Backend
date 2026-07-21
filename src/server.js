require('dotenv').config();
require('./config/firebase').initializeFirebase();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors({
  origin: function(origin, callback) {
    callback(null, true);
  },
  credentials: true,
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(morgan('dev'));

// Serve Uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const stationRoutes = require('./routes/stationRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const franchiseRoutes = require('./routes/franchiseRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const refundRoutes = require('./routes/refundRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const carbonRoutes = require('./routes/carbonRoutes');
const govRoutes = require('./routes/govRoutes');
const heatmapRoutes = require('./routes/heatmapRoutes');
const cityAnalyticsRoutes = require('./routes/cityAnalyticsRoutes');
const cmsRoutes = require('./routes/cmsRoutes');
const supportRoutes = require('./routes/supportRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const reportRoutes = require('./routes/reportRoutes');
const auditRoutes = require('./routes/auditRoutes');
const securityRoutes = require('./routes/securityRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const walletRoutes = require('./routes/walletRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const offerRoutes = require('./routes/offerRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const referralRoutes = require('./routes/referralRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const newsRoutes = require('./routes/newsRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const marketRoutes = require('./routes/marketRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const pricingRoutes = require('./routes/pricingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/vehicle', vehicleRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/station', stationRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/franchise', franchiseRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/refund', refundRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/analytics/city', cityAnalyticsRoutes);
app.use('/api/carbon', carbonRoutes);
app.use('/api/gov', govRoutes);
app.use('/api/heatmap', heatmapRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/notifications', notificationRoutes);
// Basic Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  if (err.name === 'MulterError' || err.message.includes('not allowed')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
