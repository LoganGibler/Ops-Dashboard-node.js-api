const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  origin: {
    type: String,
    default: "Misc",
  },
  steps: [],
  published: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    default: "",
  },
});

const Alerts = mongoose.model("Alerts", alertSchema);

module.exports = Alerts;
