const mongoose = require('mongoose');
require('dotenv').config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://dharamchand10x:uRTYeE41C1Zc1lD5@cluster0.p0kik.mongodb.net/Bharat_Ev?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const tickets = await db.collection('tickets').find({}).toArray();
  console.log('Tickets count:', tickets.length);
  
  const invalid = tickets.filter(t => typeof t.user === 'string');
  console.log('Invalid tickets:', invalid.length);
  
  if (invalid.length > 0) {
    await db.collection('tickets').deleteMany({ user: { $type: 'string' } });
    console.log('Deleted invalid tickets');
  }
  
  mongoose.connection.close();
}).catch(console.error);
