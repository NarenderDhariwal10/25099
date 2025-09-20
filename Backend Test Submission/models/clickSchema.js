const mongoose = require("mongoose");
const clickSchema = new mongoose.Schema({
  shortcode: { type: String, required: true },
  clickedAt: { type: Date, default: Date.now },
  referrer: String,
  userAgent: String,
  ipAddress: String
});
module.exports = mongoose.model("Click", clickSchema);