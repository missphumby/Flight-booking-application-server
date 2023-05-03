const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();

//using jwt to endcode user information and returning it back
// as a token so they use it to make requests

module.exports.generateToken = (user, callback) => {
  console.log("user", user);
  jwt.sign(
    {
      id: user._id,
      email: user.email,
      username: user.username,
      password: user.password,
      mobile: user.mobile,
      booked: user.booked,
      bucketlist: user.bucketlist,
      visited: user.visited,
      flightBooked: user.flightBooked,
      fun: user.fun,
      hotelBooked: user.hotelBooked,
      checkedItems: user.checkedItems,
    },
    process.env.JWT_KEY,
    { expiresIn: "1h" },
    (err, res) => {
      callback(err, res);
    }
  );
};

//endpoint to decode token provided by the user and check if
// to authorize the request or not

module.exports.authorizeUser = (req, res, next) => {
  const token =
    req.headers.authorization ||
    req.headers["x-access-token"] ||
    req.body.token;
  if (token) {
    jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
      if (err) {
        res.send(err);
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    res.status(401).json({
      status: "Failed",
      message: "Authentication required for this route",
    });
  }
};
