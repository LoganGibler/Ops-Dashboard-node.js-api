const mongoose = require("mongoose");

const bulletinSchema = new mongoose.Schema({
  note: {
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
});

const Bulletin = mongoose.model("Bulletin", bulletinSchema);

module.exports = Bulletin;
