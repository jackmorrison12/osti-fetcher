require("dotenv").config({
  path: `.env.local`,
});

const LastFm = require("lastfm-node-client");
const lastFm = new LastFm(process.env.LASTFM_API_KEY);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = class LastFMController {
  constructor() {}

  static filterHistory(history) {
    let results = [];
    for (const r of history) {
      if (!r["@attr"]) {
        let res = {};
        res.artist = r.artist["#text"];
        res.album = r.album["#text"];
        res.name = r.name;
        res.date = r.date.uts;
        res.image_url = r.image[3]["#text"];
        res.lastfm_url = r.url;
        results.push(res);
      }
    }
    return results;
  }

  static async getUserHistory(username, startTime) {
    let data = await lastFm.userGetRecentTracks({
      user: username,
      limit: 200,
      page: 1,
      from: startTime ? startTime : 0,
    });
    if (data.recenttracks.track.length == 0) {
      return null;
    }
    if (
      !Array.isArray(data.recenttracks.track) &&
      data.recenttracks.track["@attr"]
    ) {
      return null;
    }
    let results = this.filterHistory(data.recenttracks.track);

    let pages = data.recenttracks["@attr"].totalPages;

    for (let i = 2; i <= pages; i++) {
      console.log("Fetching LastFM page " + i + " of " + pages);
      await sleep(1000);
      data = await lastFm.userGetRecentTracks({
        user: username,
        limit: 200,
        page: i,
        from: startTime ? startTime : 0,
      });
      results.push(...this.filterHistory(data.recenttracks.track));
    }

    return results;
  }
};
