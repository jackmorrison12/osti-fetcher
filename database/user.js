var DBController = require("./mongodb.js");
var ObjectId = require("mongodb").ObjectId;

module.exports = class userDB {
  constructor() {}

  static async getUser(user_id) {
    const { db } = await DBController.connectToDatabase();
    const user = await db.collection("users").findOne(ObjectId(user_id));
    return user;
  }

  static async getSetupUsers() {
    const { db } = await DBController.connectToDatabase();
    const users = await db
      .collection("users")
      .find({ status: "fetched" })
      .project({ _id: 1 })
      .toArray();
    return users;
  }

  static async setStatus(user_id, status) {
    const { db } = await DBController.connectToDatabase();
    const result = await db
      .collection("users")
      .updateOne(
        { _id: ObjectId(user_id) },
        { $set: { status: status } },
        { upsert: true }
      );
    return result;
  }

  static async getStatus(user_id) {
    const { db } = await DBController.connectToDatabase();
    const result = await db
      .collection("users")
      .find({ _id: ObjectId(user_id) })
      .project({ status: 1 })
      .toArray();
    return result[0].status;
  }
};
