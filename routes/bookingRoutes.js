const express = require("express");
const Vehicle = require("../models/Vehicle");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

// ✅ Create a booking inside a vehicle
router.post("/", protect, async (req, res) => {
  console.log("📥 Incoming Booking Request:", req.body); 
  try {
    const { userId, vehicleId, startDate, endDate, totalPrice } = req.body;

    const dayCount = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
    if (dayCount < 1) {
      return res.status(400).json({ message: "Booking must be at least 1 full day" });
    }

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
      console.log("❌ Vehicle not found");
      return res.status(404).json({ message: "Vehicle not found!" });
  }


    // Check for date conflicts
    const isBooked = vehicle.bookings.some(booking => 
      (new Date(startDate) <= booking.endDate && new Date(endDate) >= booking.startDate)
    );
    if (isBooked) return res.status(400).json({ message: "Vehicle is already booked for these dates" });

    // Add booking to vehicle
    vehicle.bookings.push({ user: userId, startDate, endDate, totalPrice, status: "confirmed" });

    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error) {
    console.error("❌ Booking error:", error);
    res.status(500).json({ message: "Server error, please try again later" });
}
});

// ✅ Get bookings for a specific vehicle
router.get("/:vehicleId", async (req, res) => {
  try {
    console.log("📥 Fetching bookings for vehicle:", req.params.vehicleId);

    // Ensure the vehicle ID is valid
    if (!req.params.vehicleId) {
      return res.status(400).json({ message: "Vehicle ID is required" });
    }

    // Find vehicle and populate bookings
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    console.log("✅ Bookings found:", vehicle.bookings);
    res.json(vehicle.bookings);
  } catch (error) {
    console.error("❌ Server error while fetching bookings:", error);
    res.status(500).json({ message: "Server error, please try again later" });
  }
});


// ✅ Cancel a booking
router.delete("/:vehicleId/:bookingId", async (req, res) => {
  try {
    const { vehicleId, bookingId } = req.params;
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    vehicle.bookings = vehicle.bookings.filter(booking => booking._id.toString() !== bookingId);
    await vehicle.save();

    res.json({ message: "Booking canceled" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get bookings for a specific user
router.get("/user/:userId", protect, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Fetching bookings for user: ${userId}`);

    // Find all vehicles where the user has a booking
    const vehicles = await Vehicle.find({ "bookings.user": userId });

    // Extract only the bookings for that user
    const userBookings = vehicles.flatMap(vehicle =>
      vehicle.bookings
        .filter(booking => booking.user.toString() === userId)
        .map(booking => ({
          _id: booking._id,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalPrice: booking.totalPrice,
          status: booking.status,
          reviewStatus: booking.reviewStatus,
          vehicle: {
            _id: vehicle._id,
            make: vehicle.make,
            model: vehicle.model,
            image: vehicle.images?.[0], // Return vehicle image if available
          },
        }))
    );

    res.json(userBookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update an existing booking (modify dates)
router.put("/:vehicleId/:bookingId", protect, async (req, res) => {
  try {
    const { vehicleId, bookingId } = req.params;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start and end date are required" });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Find the booking
    const booking = vehicle.bookings.id(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check for conflicts excluding current booking
    const isConflict = vehicle.bookings.some(b => {
      return (
        b._id.toString() !== bookingId &&
        new Date(startDate) <= b.endDate &&
        new Date(endDate) >= b.startDate
      );
    });

    if (isConflict) {
      return res.status(400).json({ message: "New dates overlap with an existing booking" });
    }

    // Update the booking
    booking.startDate = startDate;
    booking.endDate = endDate;

    await vehicle.save();

    res.status(200).json({ message: "Booking updated successfully", booking });
  } catch (error) {
    console.error("❌ Error updating booking:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/user/:userId/payments", protect, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ "bookings.user": req.params.userId });

    const paymentHistory = vehicles.flatMap(vehicle =>
      vehicle.bookings
        .filter(booking => booking.user.toString() === req.params.userId && booking.paid)
        .map(booking => ({
          vehicle: `${vehicle.make} ${vehicle.model}`,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalPrice: booking.totalPrice,
          paymentIntentId: booking.paymentIntentId,
          status: booking.status,
        }))
    );

    res.json(paymentHistory);
  } catch (error) {
    console.error("Payment history error:", error);
    res.status(500).json({ message: "Failed to fetch payment history" });
  }
});




module.exports = router;
