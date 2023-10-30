const mongoose = require("mongoose");

const turnoverSchema = new mongoose.Schema({
  turnover: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  user: {
    type: String,
    required: true,
  },
});

const Turnover = mongoose.model("Turnover", turnoverSchema);

module.exports = Turnover;
