const mongoose = require("mongoose");

const turnoverSchema = new mongoose.Schema({
  turnover: {
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
  unchanged: {
    type: Boolean,
    required: true,
    default: true,
  },
});

const Turnover = mongoose.model("Turnover", turnoverSchema);

module.exports = Turnover;
