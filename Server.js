require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const Papa = require("papaparse");
const fs = require("fs");
const cors = require("cors");
const Vehicle = require("./models/Vehicle");

const app = express();
app.use(cors());
app.use(express.json());

// ---------------- Connect MongoDB ----------------
mongoose.connect( "mongodb+srv://hande18pradip:Pradip%4018@cluster0.xoukv2e.mongodb.net/", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error(err));

// ---------------- Configure Multer ----------------
const upload = multer({ dest: "uploads/" });

// ---------------- Upload CSV endpoint ----------------
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded.");

  const file = fs.createReadStream(req.file.path);
  const vehicles = [];

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    step: function(result) {
      const v = result.data;

      let lat = null, lng = null;
      if (v["Vehicle Location"]) {
        const match = v["Vehicle Location"].match(/\((-?\d+\.?\d*) (-?\d+\.?\d*)\)/);
        if (match) {
          lng = parseFloat(match[1]);
          lat = parseFloat(match[2]);
        }
      }

      vehicles.push({
        VIN: v.VIN,
        County: v.County,
        City: v.City,
        State: v.State,
        PostalCode: v["Postal Code"],
        ModelYear: Number(v["Model Year"]),
        Make: v.Make,
        Model: v.Model,
        EVType: v["Electric Vehicle Type"],
        CAFV: v["Clean Alternative Fuel Vehicle (CAFV) Eligibility"],
        ElectricRange: Number(v["Electric Range"]) || 0,
        BaseMSRP: Number(v["Base MSRP"]) || 0,
        LegislativeDistrict: v["Legislative District"],
        VehicleLocation: v["Vehicle Location"],
        ElectricUtility: v["Electric Utility"],
        CensusTract: v["2020 Census Tract"],
        Lat: lat,
        Lng: lng
      });
    },
    complete: async function() {
      try {
        // DELETE all existing vehicles before inserting new ones
        await Vehicle.deleteMany({});

        // Insert all vehicles in bulk
        await Vehicle.insertMany(vehicles);
        fs.unlinkSync(req.file.path); // delete temp CSV
        res.send({ message: "CSV uploaded and data saved", count: vehicles.length });
      } catch (err) {
        console.error(err);
        res.status(500).send("Error saving data to database");
      }
    }
  });
});


// ---------------- GET all vehicles ----------------
// If dataset is huge, you can use optional pagination
app.get("/vehicles", async (req, res) => {
  try {
    const vehicles = await Vehicle.find(); // remove skip/limit to get all
    res.json({ vehicles, total: vehicles.length });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ---------------- GET vehicles with pagination ----------------
app.get("/vehicles/paginated", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  try {
    const vehicles = await Vehicle.find().skip(skip).limit(limit);
    const total = await Vehicle.countDocuments();
    res.json({ vehicles, total });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ---------------- Start Server ----------------
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
