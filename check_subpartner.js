require('dotenv').config();
const mongoose = require('mongoose');
const Partner = require('./src/models/Partner');

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://developer:developer@cluster0.o5hzh.mongodb.net/ev-prime?retryWrites=true&w=majority').then(async () => {
  const sub = await Partner.findOne({isSubPartner: true}).sort({createdAt: -1});
  if (sub) {
    console.log('isSubPartner:', sub.isSubPartner);
    console.log('assignedStations:', sub.assignedStations);
    console.log('permissions:', sub.permissions);
  } else {
    console.log('No sub-partner found');
  }
  process.exit(0);
});
