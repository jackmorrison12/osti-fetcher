var DBController = require("./mongodb.js");
var ObjectId = require("mongodb").ObjectId;

module.exports = class DB {
  constructor() {}

  static async addWorkouts(workouts) {
    const { db } = await DBController.connectToDatabase();
    const workoutIDs = await db.collection("workouts").insertMany(workouts);
    return workoutIDs;
  }

  static async addNewWorkoutTypes(workouts) {
    const { db } = await DBController.connectToDatabase();
    const workoutTypeIDs = await db
      .collection("workout_types")
      .insertMany(workouts);
    if (workoutTypeIDs.insertedCount > 0) {
      return workoutTypeIDs.ops;
    }
    return [];
  }

  static async getExistingWorkoutTypes(workout_types) {
    const { db } = await DBController.connectToDatabase();
    const workouts = await db
      .collection("workout_types")
      .find({ name: { $in: workout_types } })
      .toArray();
    const workouts_duplicates = await db
      .collection("workout_types")
      .find({ duplicates: { $in: workout_types } })
      .toArray();
    return [...workouts, ...workouts_duplicates];
  }

  static async getLastWorkoutTime(user_id) {
    const { db } = await DBController.connectToDatabase();
    const time = await db
      .collection("workouts")
      .find({ user_id: user_id })
      .sort({ end_time: -1 })
      .limit(1)
      .project({ end_time: 1 })
      .toArray();
    if (time.length > 0) {
      return time[0].end_time;
    } else {
      // Use the last 10 weeks of data
      return Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 7 * 10;
    }
  }
};
