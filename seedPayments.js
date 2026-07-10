const mongoose = require('mongoose');
const Payment = require('./src/models/Payment');

const MONGO_URI = 'mongodb+srv://digicodersdevelopment_db_user:KoJGvdKsGU9IQQvk@cluster0.9ssqshr.mongodb.net/e-BharatPrime?retryWrites=true&w=majority';

const mockPayments = [
  { txnId: 'TXN-100123', user: 'Rahul Sharma', amount: 1200, method: 'UPI', status: 'Success' },
  { txnId: 'TXN-100124', user: 'Priya Patel', amount: 850, method: 'Credit Card', status: 'Success' },
  { txnId: 'TXN-100125', user: 'Amit Kumar', amount: 1500, method: 'Net Banking', status: 'Pending' },
  { txnId: 'TXN-100126', user: 'Neha Singh', amount: 700, method: 'UPI', status: 'Failed' },
  { txnId: 'TXN-100127', user: 'Vikas Yadav', amount: 950, method: 'Wallet', status: 'Success' },
  { txnId: 'TXN-100128', user: 'Sanjay Mehta', amount: 2500, method: 'Debit Card', status: 'Success' },
  { txnId: 'TXN-100129', user: 'Anjali Gupta', amount: 450, method: 'UPI', status: 'Pending' },
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected');
    
    // Clear old payments just in case
    await Payment.deleteMany({});
    
    // Insert dummy payments
    await Payment.insertMany(mockPayments);
    console.log('Successfully seeded dummy payments!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDB();
