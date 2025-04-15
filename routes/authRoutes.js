const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const router = express.Router();

// Register route
router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
  
    try {
      // Check if user already exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: "User already exists" });
      }
  
      // Hash the password before saving to the database
      // const salt = await bcrypt.genSalt(10);
      // console.log("register password", password);
      // const hashedPassword = await bcrypt.hash(password, salt);
      // console.log("register hashed password", hashedPassword);
  
      // Create a new user with hashed password
      // const user = new User({ name, email, password: hashedPassword });
       const user = new User({ name, email, password });
      await user.save();
  
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error registering user" });
    }
  });
  
// Login route
router.post("/login", async (req, res) => {
    console.log("Login Request",req.body);
    const { email, password } = req.body;
  
    try {
      // Check if user exists
      console.log("email",email);
      console.log("password",password);
      const user = await User.findOne({ email });
      console.log("user",user);
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      console.log("Entered Password:", password);  // Log entered password
      console.log("Stored Hashed Password:", user.password);
  
    // Compare the entered password with the stored hashed password using matchPassword
      const isMatch = await user.matchPassword(password);

      console.log("Password Match:", isMatch);

      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
  
      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h", // Set token expiration (1 hour)
      });
  
      // Send the JWT token and userId in response
      // res.json({ token });
      res.json({ token, userId: user._id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error logging in" });
    }
  });
  

module.exports = router;
