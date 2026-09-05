const mongoose = require('mongoose');

const URI = 'mongodb+srv://digicodersdevelopment_db_user:KoJGvdKsGU9IQQvk@cluster0.9ssqshr.mongodb.net/e-BharatPrime?retryWrites=true&w=majority';

async function findGreen() {
  await mongoose.connect(URI);
  console.log("Connected to MongoDB");
  
  // List all collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));
  
  // Search in ALL collections for green@gmail.com
  for (let col of collections) {
    const result = await mongoose.connection.db.collection(col.name).findOne({ 
      $or: [
        { appUsername: 'green@gmail.com' },
        { email: 'green@gmail.com' },
        { email: 'sv575014@gmail.com' },
        { name: 'DCT' }
      ]
    });
    if (result) {
      console.log(`FOUND in collection "${col.name}":`, JSON.stringify(result, null, 2));
    }
  }
  
  process.exit(0);
}

findGreen().catch(console.error);
