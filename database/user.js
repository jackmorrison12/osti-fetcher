var DBController = require("./mongodb.js");
var ObjectId = require("mongodb").ObjectId;

module.exports = class userDB {
  constructor() {}

  static async getUser(user_id) {
    const { db } = await DBController.connectToDatabase();
    const user = await db.collection("users").findOne(ObjectId(user_id));
    return user;
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
};
