const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10); // Hash the password before saving
  console.log("Hashed password during registration: ", this.password); // Log hashed password
  next();
});


// Method to compare passwords for login
userSchema.methods.matchPassword = async function (enteredPassword) {
  console.log("Entered password:", enteredPassword); // This should be plain text
  console.log("Stored password (hashed):", this.password); // This should be hashed
  const isMatch = await bcrypt.compare(enteredPassword, this.password);
  console.log("Password match:", isMatch);
  return isMatch;
};

module.exports = mongoose.model("User", userSchema);
