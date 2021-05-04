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

    // Get a list of all workout types

    let workout_types_set = new Set();

    for (const workout of workouts) {
      workout_types_set.add(workout.activity_type);
    }

    let workout_types = [...workout_types_set];

    // Check database if they already exist / are in the duplicates for any of them
    // Return a list of these rows

    let existing_workout_types = await DB.getExistingWorkoutTypes(
      workout_types
    );

    let workout_map = {};
    for (const workout of existing_workout_types) {
      workout_map[workout.name] = {
        id: workout._id.toString(),
        name: workout.name,
      };
      for (const duplicate of workout.duplicates) {
        workout_map[duplicate] = {
          id: workout._id.toString(),
          name: workout.name,
        };
      }
    }

    // For any which don't exist, create them in the db
    let unknown_workout_types = [];
    for (const workout of workout_types) {
      if (!(workout in workout_map)) {
        unknown_workout_types.push({ name: workout, duplicates: [] });
      }
    }

    if (unknown_workout_types.length > 0) {
      let new_workout_types = await DB.addNewWorkoutTypes(
        unknown_workout_types
      );
      for (const workout of new_workout_types) {
        workout_map[workout.name] = {
          id: workout._id.toString(),
          name: workout.name,
        };
      }
    }

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

      // Augment each workout with the workout_id from that table, and if it has a name in the
      // duplicates, then give it the proper name

      workout.activity_type = workout_map[workout.activity_type].name;
      workout.workout_id = workout_map[workout.activity_type].id;

      full_workouts.push(workout);
    }

    // Add the workouts to the database
    await DB.addWorkouts(full_workouts);

    console.log("Workouts added to database");

    return full_workouts.length;
  }

  static async getRecentWorkoutsForUser(user_id) {
    // Look up in the database when the end of their last workout was
    let time = await DB.getLastWorkoutTime(user_id);
    return await this.addWorkouts(user_id, parseInt(time) / 1000 + 1);
  }

  static async userSetup(user_id) {
    // Get the earliest listen time for the user
    let start_time = await musicDB.getFirstListenTime(user_id);
    return await this.addWorkouts(user_id, start_time);
  }
};
