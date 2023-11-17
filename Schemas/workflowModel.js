const mongoose = require("mongoose");

const workflowsSchema = new mongoose.Schema({
  workflows: {
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

const Workflows = mongoose.model("Workflows", workflowsSchema);

module.exports = Workflows;
