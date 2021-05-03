var DBController = require("./mongodb.js");
var ObjectId = require("mongodb").ObjectId;

module.exports = class DB {
  constructor() {}

  static async getKnownSongs(lastfm_urls) {
    const { db } = await DBController.connectToDatabase();
    const knownSongs = await db
      .collection("tracks")
      .find({ lastfm_url: { $in: lastfm_urls } })
      .project({ lastfm_url: 1 })
      .toArray();
    return knownSongs;
  }

  static async getNonLastfmSongs(uris) {
    const { db } = await DBController.connectToDatabase();
    const nonLastfmsongs = await db
      .collection("tracks")
      .find({ "spotify.uri": { $in: uris } })
      .project({ "spotify.uri": 1 })
      .toArray();
    return nonLastfmsongs;
  }

  static async addTracks(tracks) {
    const { db } = await DBController.connectToDatabase();
    tracks.forEach(function (track) {
      track.created_at = Math.floor(Date.now() / 1000);
    });
    const trackIDs = await db.collection("tracks").insertMany(tracks);
    return trackIDs.ops.map(({ _id, lastfm_url }) => ({ _id, lastfm_url }));
  }

  static async addLastfmURL(uri, lastfm_url) {
    const { db } = await DBController.connectToDatabase();
    const res = await db
      .collection("tracks")
      .updateOne(
        { "spotify.uri": uri },
        { $set: { lastfm_url: lastfm_url } },
        { upsert: true }
      );
    return res;
  }

  static async addListens(listens) {
    const { db } = await DBController.connectToDatabase();
    const listenIDs = await db.collection("listens").insertMany(listens);
    return listenIDs;
  }

  static async getLastListenTime(user_id) {
    const { db } = await DBController.connectToDatabase();
    const time = await db
      .collection("listens")
      .find({ user_id: user_id })
      .sort({ time: -1 })
      .limit(1)
      .project({ time: 1 })
      .toArray();
    return time[0].time;
  }

  static async getFirstListenTime(user_id) {
    const { db } = await DBController.connectToDatabase();
    const time = await db
      .collection("listens")
      .find({ user_id: user_id })
      .sort({ time: 1 })
      .limit(1)
      .project({ time: 1 })
      .toArray();
    return time[0].time;
  }
};
