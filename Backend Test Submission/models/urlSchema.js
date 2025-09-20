const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  url: { type: String, required: true },
  shortcode: { type: String, unique: true, required: true },
  validity: { type: Date, required: true }
});

module.exports = mongoose.model("URL", urlSchema);