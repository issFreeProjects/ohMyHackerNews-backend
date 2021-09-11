const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, default: null },
  email: { type: String, unique: true },
  password: { type: String },
  newsId: { type: Array, default: [], unique: false},
  token: { type: String },
});

module.exports = mongoose.model("user", userSchema);
