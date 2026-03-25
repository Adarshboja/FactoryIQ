const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: "admin" } // default admin for demo
});

module.exports = mongoose.model("User", userSchema);