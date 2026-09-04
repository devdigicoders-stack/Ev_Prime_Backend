const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const testNotification = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bharat_ev_prime');
    const Admin = require('./src/models/Admin');
    const admin = await Admin.findOne({});
    if (!admin) throw new Error('No admin found in DB');

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1d' });
    
    console.log('Got Admin Token, sending request...');
    
    const payload = {
      title: 'Curl Test Banner Offer',
      body: 'This is a test notification to check the banner upload via curl script.',
      type: 'promo',
      userId: '',
      imageUrl: 'http://localhost:5001/uploads/blogs/test-banner.jpg'
    };

    const response = await axios.post('http://localhost:5001/api/admin/notifications/send', payload, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Response Status:', response.status);
    console.log('Response Data:', response.data);
    
    // Verify in AdminBroadcast table
    const AdminBroadcast = require('./src/models/AdminBroadcast');
    const latestBroadcast = await AdminBroadcast.findOne({ title: payload.title }).sort({ createdAt: -1 });
    console.log('\n--- VERIFICATION IN DATABASE ---');
    console.log('Latest Broadcast from DB:', JSON.stringify(latestBroadcast, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  } finally {
    mongoose.disconnect();
  }
};

testNotification();
