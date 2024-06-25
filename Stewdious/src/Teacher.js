const mongoose = require("mongoose");

const TeacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  instruments: {
    type: [String],
    required: true,
  },
  profile: {
    type: String,
  },
  contact: {
    type: String,
  },
});

module.exports = mongoose.model("Teacher", TeacherSchema);
