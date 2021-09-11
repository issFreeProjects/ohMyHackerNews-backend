const mongoose = require("mongoose");

const newsHeaderSchema = new mongoose.Schema({
  author: { type: String, default: null },
  date: { type: String, default: null },
  likes: { type: Array, default: [] },
  title: { type: String, default: 'NULL' },
  counter: { type: Number, unique: true }
});

module.exports = mongoose.model("newsHeader", newsHeaderSchema);
