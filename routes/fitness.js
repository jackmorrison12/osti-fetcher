const listEndpoints = require("express-list-endpoints");

var GoogleFitController = require("../api_controllers/googlefit.js");
var DB = require("../database/fitness");
var userDB = require("../database/user");
var musicDB = require("../database/music");

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
  let user_id = req.body.user_id;

  // get tokens from db for this user
  const user = await userDB.getUser(user_id);

  oauth2Client.setCredentials(user.google_tokens);

  const fitness = google.fitness({ version: "v1", auth: oauth2Client });

  let current_time = Math.floor(Date.now() / 1000);

  // get the earliest listen time for the user (x)

  let start_time = await musicDB.getFirstListenTime(user_id);

  // iterate over 2 week intervals back from current date until x (on non-setup one, this will be back until last workout)

  var workouts = [];

  for (var i = parseInt(start_time); i < current_time; i += 60 * 60 * 24 * 14) {
    // console.log("start: " + i * 1000);
    // console.log(
    //   "end: " +
    //     Math.min((i + 60 * 60 * 24 * 14) * 1000 - 1, current_time * 1000)
    // );
    // console.log(parseInt(i));
    // console.log(current_time);
    // console.log(parseInt(i) < current_time);
    let result = await fitness.users.dataset.aggregate({
      userId: "me",
      requestBody: {
        startTimeMillis: i * 1000,
        endTimeMillis: Math.min(
          (i + 60 * 60 * 24 * 14) * 1000 - 1,
          current_time * 1000
        ),
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

    for (const workout of result.data.bucket) {
      var w = {};
      w.user_id = user_id;
      w.start_time = workout.startTimeMillis;
      w.end_time = workout.endTimeMillis;
      w.activity_type = workout.session.name;

      // Calories, active mins, steps, distance, speed (avg, max, min), heart rate (avg, max, min)
      if (workout.dataset[0].point[0]) {
        w.calories_burned = workout.dataset[0].point[0].value[0].fpVal;
      }
      if (workout.dataset[1].point[0]) {
        w.active_minutes = workout.dataset[1].point[0].value[0].intVal;
      }
      if (workout.dataset[2].point[0]) {
        w.steps = workout.dataset[2].point[0].value[0].intVal;
      }
      if (workout.dataset[3].point[0]) {
        w.distance = workout.dataset[3].point[0].value[0].fpVal;
      }
      if (workout.dataset[4].point[0]) {
        w.speed = {};
        w.speed.avg = workout.dataset[4].point[0].value[0].fpVal;
        w.speed.max = workout.dataset[4].point[0].value[1].fpVal;
        w.speed.min = workout.dataset[4].point[0].value[2].fpVal;
      }
      if (workout.dataset[5].point[0]) {
        w.heart_rate = {};
        w.heart_rate.avg = workout.dataset[5].point[0].value[0].fpVal;
        w.heart_rate.max = workout.dataset[5].point[0].value[1].fpVal;
        w.heart_rate.min = workout.dataset[5].point[0].value[2].fpVal;
      }
      workouts.push(w);
    }
  }

  // now we have a list of workouts - we need to augment with the datapoints
  // - for each, do an API call to get the datapoints of each workout and augment the object

  let full_workouts = [];

  for (const workout of workouts) {
    let result = await fitness.users.dataset.aggregate({
      userId: "me",
      requestBody: {
        startTimeMillis: workout.start_time,
        endTimeMillis: workout.end_time,
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
        bucketByTime: { durationMillis: 10000 },
      },
    });

    points = [];

    for (const point of result.data.bucket) {
      var p = {};

      p.start_time = point.startTimeMillis;
      p.end_time = point.endTimeMillis;
      if (point.dataset[0].point[0]) {
        p.calories_burned = point.dataset[0].point[0].value[0].fpVal;
      }
      if (point.dataset[1].point[0]) {
        p.active = point.dataset[1].point[0].value[0].intVal;
      }
      if (point.dataset[2].point[0]) {
        p.steps = point.dataset[2].point[0].value[0].intVal;
      }
      if (point.dataset[3].point[0]) {
        p.distance = point.dataset[3].point[0].value[0].fpVal;
      }
      if (point.dataset[4].point[0]) {
        p.speed = point.dataset[4].point[0].value[0].fpVal;
      }
      if (point.dataset[5].point[0]) {
        p.heart_rate = point.dataset[5].point[0].value[0].fpVal;
      }
      points.push(p);
    }

    workout.data = points;

    full_workouts.push(workout);
  }

  // add the workouts to the database

  DB.addWorkouts(full_workouts);

  res.json(full_workouts.length);

  // TEST CALL

  // let result = await fitness.users.dataset.aggregate({
  //   userId: "me",
  //   requestBody: {
  //     startTimeMillis: 1617132544000,
  //     endTimeMillis: 1617554770000,
  //     aggregateBy: [
  //       {
  //         dataTypeName: "com.google.calories.expended",
  //       },
  //       {
  //         dataTypeName: "com.google.active_minutes",
  //       },
  //       {
  //         dataTypeName: "com.google.step_count.delta",
  //       },
  //       {
  //         dataTypeName: "com.google.distance.delta",
  //       },
  //       {
  //         dataTypeName: "com.google.speed",
  //       },
  //       {
  //         dataTypeName: "com.google.heart_rate.bpm",
  //       },
  //     ],
  //     bucketBySession: {
  //       minDurationMillis: 1000,
  //     },
  //   },
  // });

  // // console.log(result.data.bucket);

  // for (const workout of result.data.bucket) {
  //   var w = {};
  //   w.start_time = workout.startTimeMillis;
  //   w.end_time = workout.endTimeMillis;
  //   w.activity_type = workout.session.name;

  //   // Calories, active mins, steps, distance, speed (avg, max, min), heart rate (avg, max, min)
  //   w.calories_burned = workout.dataset[0].point[0].value[0].fpVal;
  //   w.active_minutes = workout.dataset[1].point[0].value[0].intVal;
  //   if (workout.dataset[2].point[0]) {
  //     w.steps = workout.dataset[2].point[0].value[0].intVal;
  //   }
  //   if (workout.dataset[3].point[0]) {
  //     w.distance = workout.dataset[3].point[0].value[0].fpVal;
  //   }
  //   if (workout.dataset[4].point[0]) {
  //     w.speed = {};
  //     w.speed.avg = workout.dataset[4].point[0].value[0].fpVal;
  //     w.speed.max = workout.dataset[4].point[0].value[1].fpVal;
  //     w.speed.min = workout.dataset[4].point[0].value[2].fpVal;
  //   }
  //   if (workout.dataset[5].point[0]) {
  //     w.heart_rate = {};
  //     w.heart_rate.avg = workout.dataset[5].point[0].value[0].fpVal;
  //     w.heart_rate.max = workout.dataset[5].point[0].value[1].fpVal;
  //     w.heart_rate.min = workout.dataset[5].point[0].value[2].fpVal;
  //   }
  // }
  // res.send(result.data);
});

module.exports = router;
