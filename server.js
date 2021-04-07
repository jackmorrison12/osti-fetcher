const listEndpoints = require("express-list-endpoints");

var UserController = require("./controllers/user.js");
var MusicController = require("./controllers/music.js");
var FitnessController = require("./controllers/fitness.js");
var DBController = require("./database/mongodb.js");
var ObjectId = require("mongodb").ObjectId;

var express = require("express"),
  app = express();

app.listen(process.env.PORT || 4000, function () {
  console.log("listening on 4000");
});

app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "https://osti.uk");
  if (process.env.NODE_ENV === "development") {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  }

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/", function (req, res) {
  res.send(
    listEndpoints(app).map(function (item) {
      return item.path + " " + item.methods;
    })
  );
});

var musicRoutes = require("./routes/music");
app.use("/music", musicRoutes);

var fitnessRoutes = require("./routes/fitness");
app.use("/fitness", fitnessRoutes);

// General setup endpoint
app.post("/setup", async function (req, res) {
  res.json("fetching_lastfm");
  await UserController.setStatus(req.body.user_id, "fetching_lastfm");
  await MusicController.userSetup(req.body.user_id);
  await UserController.setStatus(req.body.user_id, "fetching_googlefit");
  await FitnessController.userSetup(req.body.user_id);
  await UserController.setStatus(req.body.user_id, "fetched");
});

// General update endpoint
app.post("/update", async function (req, res) {
  res.json("fetching_lastfm");
  await UserController.setStatus(req.body.user_id, "fetching_lastfm");
  await MusicController.getRecentListensForUser(req.body.user_id);
  await UserController.setStatus(req.body.user_id, "fetching_googlefit");
  await FitnessController.getRecentWorkoutsForUser(req.body.user_id);
  await UserController.setStatus(req.body.user_id, "fetched");
});

// Endpoint to test queries in js format
app.post("/test", async function (req, res) {
  const { db } = await DBController.connectToDatabase();
  try {
    const status = await db
      .collection("users")
      .find({ _id: ObjectId(req.body.user_id) })
      .project({ status: 1, _id: 0 })
      .toArray();
    console.log("Endpoint hit by " + req.headers.referer);
    res.json(status);
  } catch (e) {
    console.log("Endpoint incorrectly hit by " + req.headers.referer);
    res.json("Incorrect or no body");
  }
});
