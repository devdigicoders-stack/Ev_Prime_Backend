const mongoose = require('mongoose');

const connectorMasterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },      // e.g. CCS2, CHAdeMO, Type2, AC, Tesla NACS
  subtitle: { type: String },                                // e.g. DC Fast • 120 kW
  powerKw: { type: Number, required: true },                 // e.g. 120
  chargeType: { type: String, enum: ['AC', 'DC'], required: true }, // AC or DC
  icon: { type: String, default: 'ev_station' }              // Flutter icon mapping name
}, { timestamps: true });

module.exports = mongoose.model('ConnectorMaster', connectorMasterSchema);
