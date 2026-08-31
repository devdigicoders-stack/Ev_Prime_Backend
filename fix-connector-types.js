require('dotenv').config();
const mongoose = require('mongoose');
const Station = require('./src/models/Station');

async function fixData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const stations = await Station.find({ partner: 'Technical' });
    console.log(`Found ${stations.length} stations for Technical`);
    
    for (const st of stations) {
      if (!st.connectorTypes || st.connectorTypes.length === 0) {
        const count = st.connectors || 1;
        const newConnectorTypes = [];
        
        for (let i = 0; i < count; i++) {
          newConnectorTypes.push({
            type: i % 2 === 0 ? 'CCS2' : 'Type2',
            powerKw: i % 2 === 0 ? 60 : 22,
            pricePerUnit: 18,
            totalCount: 1,
            availableCount: st.status === 'Active' || st.status === 'Online' ? 1 : 0,
            chargeType: i % 2 === 0 ? 'DC' : 'AC'
          });
        }
        
        st.connectorTypes = newConnectorTypes;
        await st.save();
        console.log(`Added ${count} actual connectors to ${st.name}`);
      }
    }

    console.log('Fixed connectorTypes successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fixData();
