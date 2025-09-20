const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  VIN: String,
  County: String,
  City: String,
  State: String,
  PostalCode: String,
  ModelYear: Number,
  Make: String,
  Model: String,
  EVType: String,
  CAFV: String,
  ElectricRange: Number,
  BaseMSRP: Number,
  LegislativeDistrict: String,
  VehicleLocation: String,
  ElectricUtility: String,
  CensusTract: String,
  Lat: Number,
  Lng: Number
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
