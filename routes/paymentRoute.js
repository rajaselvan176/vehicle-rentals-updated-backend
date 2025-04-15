const express = require("express");
const stripe = require("../config/stripe");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

router.post("/create-checkout-session", protect, async (req, res) => {
  const { vehicle, startDate, endDate } = req.body;

  const dayCount = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
  const totalAmount = vehicle.pricePerDay * dayCount;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${vehicle.make} ${vehicle.model} Rental`,
            },
            unit_amount: Math.round(totalAmount * 100), // amount in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
      metadata: {
        vehicleId: vehicle._id,
        userId: req.user,
        startDate,
        endDate,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe session error:", err);
    res.status(500).json({ message: "Payment session creation failed" });
  }
});

router.post("/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
  
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("Webhook Error:", err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  
    if (event.type === "checkout.session.completed") {
      const data = event.data.object;
      const { userId, vehicleId, startDate, endDate } = data.metadata;
  
      // Save payment and booking in DB
      const vehicle = await Vehicle.findById(vehicleId);
      const dayCount = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
      const totalPrice = dayCount * vehicle.pricePerDay;
  
      vehicle.bookings.push({
        user: userId,
        startDate,
        endDate,
        totalPrice,
        status: "confirmed",
        paid: true,
        paymentIntentId: data.payment_intent,
      });
  
      await vehicle.save();
    }
  
    res.status(200).json({ received: true });
  });
  
