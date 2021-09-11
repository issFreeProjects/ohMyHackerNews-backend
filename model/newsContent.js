const mongoose = require("mongoose");

const newsContentSchema = new mongoose.Schema({
  id: { type: String, default: null },
  content: { type: String, default: '' }
});

module.exports = mongoose.model("newsContent", newsContentSchema);