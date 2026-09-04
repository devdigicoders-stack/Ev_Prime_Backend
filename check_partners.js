require('dotenv').config();
const mongoose = require('mongoose');
const Partner = require('./src/models/Partner');

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://developer:developer@cluster0.o5hzh.mongodb.net/ev-prime?retryWrites=true&w=majority').then(async () => {
  const allPartners = await Partner.find({}).sort({createdAt: -1}).limit(5);
  allPartners.forEach(p => {
    console.log(p.name, '| isSubPartner:', p.isSubPartner, '| assignedStations:', p.assignedStations?.length, '| role:', p.subPartnerRole);
  });
  process.exit(0);
});
