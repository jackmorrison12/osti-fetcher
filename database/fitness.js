var DBController = require("./mongodb.js");
var ObjectId = require("mongodb").ObjectId;

module.exports = class DB {
  constructor() {}

  static async addWorkouts(workouts) {
    const { db } = await DBController.connectToDatabase();
    const workoutIDs = await db.collection("workouts").insertMany(workouts);
    return workoutIDs;
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
      return Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 7 * 10;
    }
  }
};
