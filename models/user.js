// This is a Mongoose schema (model) for a user.

const mongoose = require("mongoose");
const user = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String },
  flightBooked: Boolean,
  fun: Boolean,
  hotelBooked: Boolean,
  checkedItems: String,
  address: { type: String, default: "home" },

  booked: [
    {
      source: String,
      destination: String,
      dateto: String,
      datefrom: String,
      hotelId: String,
      hotelcost: Number,
      hotelimageurl: String,
      hotellocation: String,
      hotelname: String,
      sportcost: Number,
      sporttype: String,
      sportimageurl: String,
      flightarrival: String,
      flightdeparture: String,
      flightcarriercode: String,
      flightnumber: Number,
      flightcost: Number,
    },
  ],
  bucketlist: [{ type: String }],
  visited: [{ type: String }],
});

module.exports = mongoose.model("TRVL_User", user);
