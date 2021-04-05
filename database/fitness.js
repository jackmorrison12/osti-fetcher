var DBController = require("./mongodb.js");
var ObjectId = require("mongodb").ObjectId;

module.exports = class DB {
  constructor() {}

  static async addWorkouts(workouts) {
    const { db } = await DBController.connectToDatabase();
    const workoutIDs = await db.collection("workouts").insertMany(workouts);
    return workoutIDs;
  }
};
