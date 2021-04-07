require("dotenv").config({
  path: `.env.local`,
});

var GoogleFitController = require("../api_controllers/googlefit.js");
var DB = require("../database/fitness");
var userDB = require("../database/user");
var musicDB = require("../database/music");

module.exports = class MusicController {
  constructor() {}

  static async addWorkouts(user_id, start_time) {
    const user = await userDB.getUser(user_id);

    var workouts = await GoogleFitController.getWorkouts(
      user_id,
      user.google_tokens,
      start_time
    );

    if (workouts.length == 0) {
      console.log("No workouts found");
      return 0;
    }

    console.log(workouts.length + " workouts found");

    // now we have a list of workouts - we need to augment with the datapoints
    // - for each, do an API call to get the datapoints of each workout and augment the object

    let full_workouts = [];

    for (const workout of workouts) {
      let result = await GoogleFitController.getWorkoutData(
        user.google_tokens,
        workout.start_time,
        workout.end_time
      );

      let points = [];

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

    // Add the workouts to the database
    DB.addWorkouts(full_workouts);

    console.log("Workouts added to database");

    return full_workouts.length;
  }

  static async getRecentWorkoutsForUser(user_id) {
    // Look up in the database when the end of their last workout was
    let time = await DB.getLastWorkoutTime(user_id);
    return await this.addWorkouts(user_id, parseInt(time) + 1);
  }

  static async userSetup(user_id) {
    // Get the earliest listen time for the user
    let start_time = await musicDB.getFirstListenTime(user_id);
    return await this.addWorkouts(user_id, start_time);
  }
};
