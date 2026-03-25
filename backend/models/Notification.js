const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  message: String,
  user: String,
  read: { type: Boolean, default: false }
});

module.exports = mongoose.model("Notification", schema);