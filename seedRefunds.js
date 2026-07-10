const mongoose = require('mongoose');
const Refund = require('./src/models/Refund');

const MONGO_URI = 'mongodb+srv://digicodersdevelopment_db_user:KoJGvdKsGU9IQQvk@cluster0.9ssqshr.mongodb.net/e-BharatPrime?retryWrites=true&w=majority';

const mockRefunds = [
  { refundId: 'RFND98234', user: 'Rohan Gupta', amount: 1250, reason: 'Double Charge', status: 'Approved' },
  { refundId: 'RFND98235', user: 'Aisha Khan', amount: 450, reason: 'Station Offline', status: 'Pending' },
  { refundId: 'RFND98236', user: 'Vikram Singh', amount: 300, reason: 'Session Cancelled', status: 'Approved' },
  { refundId: 'RFND98237', user: 'Neha Patel', amount: 780, reason: 'Payment Failed', status: 'Pending' },
  { refundId: 'RFND98238', user: 'Amit Desai', amount: 200, reason: 'Wrong Connector', status: 'Rejected' },
];

const seedRefunds = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected for Seeding');
    
    await Refund.deleteMany(); // Clear existing refunds
    console.log('Existing refunds cleared');

    await Refund.insertMany(mockRefunds);
    console.log('Dummy refunds inserted successfully!');

    process.exit();
  } catch (error) {
    console.error('Error seeding refunds:', error);
    process.exit(1);
  }
};

seedRefunds();
