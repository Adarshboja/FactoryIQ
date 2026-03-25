const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: String,
  status: String,
  owner: String,
  description: String
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);