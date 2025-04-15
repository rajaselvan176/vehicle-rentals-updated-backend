const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ["confirmed", "canceled", "pending"], default: "pending" },
  reviewStatus: { type: Boolean, default: false } 
});

const vehicleSchema = new mongoose.Schema({
  make: String,
  model: String,
  year: Number,
  location: String,
  pricePerDay: Number,
  availability: Boolean,
  images: [String],
  type: String,
  bookings: [bookingSchema], // ✅ Embed bookings inside Vehicle
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
