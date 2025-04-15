const express = require('express');
const Vehicle = require('../models/Vehicle');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;

