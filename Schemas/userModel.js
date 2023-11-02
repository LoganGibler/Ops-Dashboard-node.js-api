const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    min: 5,
    max: 20,
  },
  password: {
    type: String,
    required: true,
    min: 6,
    max: 20,
  },
  admin: {
    type: Boolean,
    required: true,
    default: false,
  },
});

const Users = mongoose.model("Ops_Users", userSchema);

module.exports = Users;
