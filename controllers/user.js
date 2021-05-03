require("dotenv").config({
  path: `.env.local`,
});

var DB = require("../database/user");

module.exports = class UserController {
  constructor() {}

  static async setStatus(user_id, status) {
    console.log("Setting status for user " + user_id + " to " + status);
    return await DB.setStatus(user_id, status);
  }

  static async getStatus(user_id) {
    return await DB.getStatus(user_id);
  }

  static async getSetupUsers() {
    return await DB.getSetupUsers();
  }
};
