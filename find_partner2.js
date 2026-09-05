const mongoose = require('mongoose');

const URI = 'mongodb+srv://digicodersdevelopment_db_user:KoJGvdKsGU9IQQvk@cluster0.9ssqshr.mongodb.net/e-BharatPrime?retryWrites=true&w=majority';

async function findGreen() {
  await mongoose.connect(URI);
  console.log("Connected");

  // Check partners collection directly with raw query
  const all = await mongoose.connection.db.collection('partners').find(
    {},
    { projection: { name: 1, email: 1, appUsername: 1, phone: 1, contactPerson: 1 } }
  ).toArray();
  
  console.log("All partners in DB:");
  for (let p of all) {
    console.log(`  - name: ${p.name}, email: ${p.email}, appUsername: ${p.appUsername}, contact: ${p.contactPerson}, phone: ${p.phone}`);
  }
  
  // Also check franchises
  const franchises = await mongoose.connection.db.collection('franchises').find(
    {},
    { projection: { name: 1, email: 1, appUsername: 1, phone: 1 } }
  ).toArray();
  console.log("\nAll franchises:");
  for (let f of franchises) {
    console.log(`  - name: ${f.name}, email: ${f.email}, appUsername: ${f.appUsername}`);
  }

  process.exit(0);
}

findGreen().catch(console.error);
