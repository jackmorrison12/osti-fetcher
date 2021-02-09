var DBController = require("./mongodb.js");
var ObjectId = require("mongodb").ObjectId;

module.exports = class DB {
  constructor() {}

  static async getUser(user_id) {
    const { db } = await DBController.connectToDatabase();
    const user = await db.collection("users").findOne(ObjectId(user_id));
    return user;
  }
};
