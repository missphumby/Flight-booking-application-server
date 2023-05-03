const mongoose = require("mongoose");
const sports = new mongoose.Schema({
  name: String,
  image: String,
  price: String,
  keywords: String,
});

module.exports = mongoose.model("sports", sports);
