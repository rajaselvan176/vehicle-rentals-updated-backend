const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // use dotenv

module.exports = stripe;
