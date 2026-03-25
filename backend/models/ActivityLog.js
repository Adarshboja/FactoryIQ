const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  action: String,
  projectId: String,
  projectTitle: String,
  status: String,
  user: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ActivityLog", logSchema);
