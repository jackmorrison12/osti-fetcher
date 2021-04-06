require("dotenv").config({
  path: `.env.local`,
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_ID,
  process.env.GOOGLE_SECRET,
  process.env.BASE_URL + "/fitness/auth"
);

module.exports = class GoogleFitController {
  constructor() {}

  static async getWorkouts(user_id, tokens, start_time) {
    oauth2Client.setCredentials(tokens);
    const fitness = google.fitness({ version: "v1", auth: oauth2Client });
    let current_time = Math.floor(Date.now() / 1000);
    var workouts = [];

    for (
      var i = parseInt(start_time);
      i < current_time;
      i += 60 * 60 * 24 * 14
    ) {
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

      // Check if the first workout is a duplicate - if so, don't add it again
      if (
        result.data.bucket[0] &&
        workouts.length > 0 &&
        workouts[workouts.length - 1].start_time ==
          result.data.bucket[0].startTimeMillis
      ) {
        result.data.bucket.splice(0, 1);
      }

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

    return workouts;
  }

  static async getWorkoutData(tokens, start_time, end_time) {
    oauth2Client.setCredentials(tokens);
    const fitness = google.fitness({ version: "v1", auth: oauth2Client });
    return await fitness.users.dataset.aggregate({
      userId: "me",
      requestBody: {
        startTimeMillis: start_time,
        endTimeMillis: end_time,
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
  }
};
