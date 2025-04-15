const express = require("express");
const Review = require("../models/Review");
const protect = require("../middleware/authMiddleware");
const vehicle = require("../models/Vehicle");

const router = express.Router();

// 📝 Create a review (user must be authenticated)
router.post("/", protect, async (req, res) => {
  const { vehicleId, bookingId, rating, comment } = req.body;
  const userId = req.user;

  if (!vehicleId || !bookingId || !rating) {
    return res.status(400).json({ message: "Required fields missing." });
  }

  try {
    const existingReview = await Review.findOne({ userId, vehicleId, bookingId });
    if (existingReview) {
      return res.status(400).json({ message: "Review already submitted." });
    }

    // Save the new review
    const review = new Review({
      userId,
      vehicleId,
      bookingId,
      rating,
      comment,
    });
    await review.save();

    // ✅ Update the reviewStatus to true for the matching booking in the vehicle
    await vehicle.updateOne(
      { _id: vehicleId, "bookings._id": bookingId },
      { $set: { "bookings.$.reviewStatus": true } }
    );

    res.status(201).json({ message: "Review submitted for moderation." });
  } catch (err) {
    console.error("Review error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get approved reviews for a vehicle
const mongoose = require("mongoose");

router.get("/vehicle/:vehicleId", async (req, res) => {
  try {
    const vehicleObjectId = new mongoose.Types.ObjectId(req.params.vehicleId);
    console.log("vehicleId Backend:", vehicleObjectId);

    const reviews = await Review.find({
      vehicleId: vehicleObjectId
    }).populate("userId", "name");

    console.log("Fetched reviews:", reviews);
    res.json(reviews);
  } catch (err) {
    console.error("Review fetch error:", err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});


router.get("/booking/:bookingId", async (req, res) => {
  try {
    const bookingObjectId = new mongoose.Types.ObjectId(req.params.bookingId);

    const reviews = await Review.find({
      bookingId: bookingObjectId
    }).populate("userId", "name");

    console.log("Fetched reviews:", reviews);
    res.json(reviews);
  } catch (err) {
    console.error("Review fetch error:", err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});


module.exports = router;
