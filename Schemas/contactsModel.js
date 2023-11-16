const mongoose = require("mongoose");

const contactsSchema = new mongoose.Schema({
  contacts: {
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

const Contacts = mongoose.model("Contacts", contactsSchema);

module.exports = Contacts;
