var DBController = require("./mongodb.js");
var ObjectId = require("mongodb").ObjectId;

module.exports = class DB {
  constructor() {}

  static async getUser(user_id) {
    const { db } = await DBController.connectToDatabase();
    const user = await db.collection("users").findOne(ObjectId(user_id));
    return user;
  }

  static async getKnownSongIDs(lastfm_urls) {
    const { db } = await DBController.connectToDatabase();
    const knownSongs = await db
      .collection("tracks")
      .find({ lastfm_url: { $in: lastfm_urls } }, { fields: { lastfm_url: 1 } })
      .toArray();
    return knownSongs;
  }

  static async addTracks(tracks) {
    const { db } = await DBController.connectToDatabase();
    // Add createdat and updatedat fields
    const trackIDs = await db.collection("tracks").insertMany(tracks);
    return trackIDs.ops.map(({ _id, lastfm_url }) => ({ _id, lastfm_url }));
  }
};
