const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Partner = require('./src/models/Partner');
  const p = await Partner.find();
  console.log(JSON.stringify(p.map(x => ({
    name: x.name, 
    isSubPartner: x.isSubPartner, 
    permissions: x.permissions,
    appUsername: x.appUsername
  })), null, 2));
  process.exit();
});
