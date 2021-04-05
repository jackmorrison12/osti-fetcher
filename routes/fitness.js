const listEndpoints = require("express-list-endpoints");

var GoogleFitController = require("../api_controllers/googlefit.js");
var DB = require("../database/fitness");
var userDB = require("../database/user");

var express = require("express"),
  router = express.Router();

const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_ID,
  process.env.GOOGLE_SECRET,
  process.env.BASE_URL + "/fitness/auth"
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

router.get("/", function (req, res) {
  res.send(
    listEndpoints(router).map(function (item) {
      return item.path + " " + item.methods;
    })
  );
});

router.post("/userSetup", async function (req, res) {
  // get tokens from db for this user
  const user = await userDB.getUser(req.body.user_id);

  console.log(user.google_tokens);
  oauth2Client.setCredentials(user.google_tokens);

  const fitness = google.fitness({ version: "v1", auth: oauth2Client });

  let current_time = Date.now();

  // get the earliest listen time for the user (x)

  // iterate over 2 week intervals back from current date until x (on non-setup one, this will be back until last workout)

  // now we have a list of workouts - we need to augment with the datapoints
  // - for each, do an API call to get the datapoints of each workout and augment the object

  // add the workouts to the database

  let result = await fitness.users.dataset.aggregate({
    userId: "me",
    requestBody: {
      startTimeMillis: 1617132544000,
      endTimeMillis: 1617554770000,
      aggregateBy: [
        {
          dataTypeName: "com.google.calories.expended",
        },
        {
          dataTypeName: "com.google.active_minutes",
        },
        {
          dataTypeName: "com.google.step_count.delta",
        },
        {
          dataTypeName: "com.google.distance.delta",
        },
        {
          dataTypeName: "com.google.speed",
        },
        {
          dataTypeName: "com.google.heart_rate.bpm",
        },
      ],
      bucketBySession: {
        minDurationMillis: 1000,
      },
    },
  });

  console.log(result.data);
  res.send(result.data);
});

module.exports = router;
