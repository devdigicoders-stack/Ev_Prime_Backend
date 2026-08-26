require('dotenv').config();
const mongoose = require('mongoose');
const Station = require('./src/models/Station');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const stations = await Station.find({ partner: 'Technical' });
    console.log(`Found ${stations.length} stations for Technical`);
    
    stations.forEach(st => {
      let typesCount = st.connectorTypes ? st.connectorTypes.reduce((acc, c) => acc + (c.totalCount || 1), 0) : 0;
      console.log(`- ${st.name} | status: ${st.status} | connectors field: ${st.connectors} | actual connectorTypes count: ${typesCount}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkData();
