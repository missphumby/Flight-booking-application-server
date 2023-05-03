// This is the entry point for the backend (aka the index.js file).
// All backend dependencies are connected here.
// Mongoose is connected, RESTful routes defined.

const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const expressSession = require("express-session");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const User = require("./models/user");
const Hotel = require("./models/hotels");
const Sports = require("./models/sports");
require("dotenv").config();
const { generateToken, authorizeUser } = require("./auth/verifyToken");
var Amadeus = require("amadeus");

const app = express();
const PORT = 5000;

//========================================= MONGODB CONNECT

mongoose.connect(
  process.env.MONGO_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log("Database (MongoDB) is now connected");
  }
);

//========================================= MIDDLEWARE

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000", // location of react frontend
    credentials: true,
  })
);
app.use(
  expressSession({
    secret: "mondal",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(cookieParser("mondal"));

//========================================= amadeus ROUTES
var amadeus = new Amadeus({
  clientId: "6GAGQ9rgmdzWYxqpDfGKIlrtElar47pD",
  clientSecret: "zSzVsoaQNZOKuJWg",
});

// searches for available flights
app.post("/date", async function (req, res) {
  arrival = req.body.arrival.toString();
  locationDeparture = req.body.locationDeparture;
  locationArrival = req.body.locationArrival;
  const response = await amadeus.shopping.flightOffersSearch
    .get({
      originLocationCode: locationDeparture,
      destinationLocationCode: locationArrival,
      departureDate: arrival.toString(),
      adults: "1",
    })
    .catch((err) => console.log(err));
  try {
    return res.status(200).json(response.data);
    //console.log(response.body);
  } catch (err) {
    return res.json(err);
  }
});

// //========================================= AUTHENTICATION ROUTES

// login user
app.post("/login", (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      if (user.length < 1) {
        return res.status(401).json({
          message: "Authorization failed",
        });
      }
      bcrypt.compare(req.body.password, user[0].password, (err, result) => {
        if (err) {
          res.status(409).json({
            error: err,
            message: "incorrect password",
          });
        }
        if (result) {
          generateToken(user[0], (err, token) => {
            if (err) {
              res.json({ msg: "Unable to encode token" });
            } else {
              res.status(201).send({
                msg: "User logged in successfully!",
                user: user[0],
                token,
              });
            }
          });
        } else {
          res.status(401).json({
            error: "email or password incorrect",
          });
        }
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: err,
      });
    });
});

//register user
app.post("/register", (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      if (user.length >= 1) {
        res.status(409).json({ message: "mail exists" });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({ error: err });
          } else {
            const user = {
              username: req.body.username,
              mobile: req.body.mobile,
              email: req.body.email,
              flightBooked: req.body.flightBooked,
              hotelBooked: req.body.hotelBooked,
              fun: req.body.fun,
              checkedItems: req.body.checkedItems,
              password: hash,
            };

            User.create(user, (err, user) => {
              if (err) throw err;
              user.save((err, result) => {
                console.log(user);
                if (err) {
                  res.status(500).send({ message: err });
                  return;
                }
                if (result) {
                  generateToken(user, (err, token) => {
                    console.log("got here", token);
                    if (err) {
                      res.json({ error: "Unable to encode token" });
                    } else {
                      res.status(201).send({
                        success: "User created successfully!",
                        user,
                        token,
                      });
                    }
                  });
                }
              });
            });
          }
        });
      }
    });
});

// =================== User Details ROUTES:
//fetch user profile
app.get("/me/:id", authorizeUser, (req, res) => {
  if (req.decoded.id == req.params.id) {
    User.findById(req.params.id)
      .exec()
      .then((data) => {
        res.status(200).json({ success: true, data });
      })
      .catch((err) => res.status(404).send("No user found."));
  } else {
    res.json({ error: "can not fetch data for another user" });
  }
});

app.get("/getuser", (req, res) => {
  if (!req.user) {
    res.send("Please login first");
  }
  if (req.user) {
    res.send(req.user);
  }
});

//=========================== Activities Routes
app.get("/getSports", (req, res) => {
  Sports.find({}, async (err, doc) => {
    if (!doc) res.send("No sports in DB");
    if (doc) {
      res.status(200).json(doc);
    }
  });
});
app.post("/activitysearch", (req, res) => {
  let loc = req.body.activity ? req.body.activity.split(", ") : [];
  // var splitLoc = loc.split(",");
  let act = Object.entries(loc).map((ca) => {
    return ca[1];
  });
  console.log(act);
  // console.log("destination passed: "+ loc);
  if (loc == "") {
    Sports.find({}, async (err, doc) => {
      if (err) throw err;
      if (doc) {
        res.send(doc);
        //console.log(doc);
      }
    });
  } else {
    Sports.find(
      {
        $or: [
          {
            keywords: { $in: act },
          },
        ],
      },
      async (err, doc) => {
        if (err) throw err;
        if (doc) {
          await res.send(doc);
          console.log(doc);
        }
      }
    );
  }
});

// =================== Hotel ROUTES:

app.get("/gethotels", (req, res) => {
  Hotel.find({}, async (err, doc) => {
    if (!doc) res.send("No hotels in DB");
    if (doc) {
      res.send(doc);
    }
  });
});

app.post("/hotelsearch", (req, res) => {
  const loc = req.body.searchloc;
  // console.log("destination passed: "+ loc);
  if (loc === "") {
    Hotel.find({}, async (err, doc) => {
      if (err) throw err;
      if (doc) {
        res.send(doc);
        //console.log(doc);
      }
    });
  } else {
    Hotel.find(
      {
        $or: [
          { location: { $regex: loc, $options: "i" } },
          // { iata: { $regex: loc, $options: "i" } },
        ],
      },
      async (err, doc) => {
        if (err) throw err;
        if (doc) {
          await res.send(doc);
          //console.log(doc);
        }
      }
    );
  }
});

app.patch("/book/:userId", (req, res) => {
  var user_id = req.params.userId;
  User.findByIdAndUpdate(
    user_id,
    { $push: { booked: req.body } },
    { safe: true, upsert: true, new: true },
    function (err, model) {
      if (err) {
        console.log(err);
        return res.send(err);
      }
      return res.json(model);
    }
  ).populate("booked");
});

app.get("/userstatus", (req, res) => {
  if (!req.user) {
    res.send(false);
    //console.log("Not logged in")
  } else {
    res.send(true);
    //console.log("Logged in")
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Backend started at http://localhost:${PORT}`);
});
