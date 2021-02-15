require("dotenv").config({
  path: `.env.local`,
});

var SpotifyWebApi = require("spotify-web-api-node");

var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_ID,
  clientSecret: process.env.SPOTIFY_SECRET,
});

spotifyApi.clientCredentialsGrant().then(
  function (data) {
    console.log("The access token expires in " + data.body["expires_in"]);
    console.log("The access token is " + data.body["access_token"]);

    // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(data.body["access_token"]);
  },
  function (err) {
    console.log("Something went wrong when retrieving an access token", err);
  }
);

module.exports = class SpotifyController {
  constructor() {}

  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async getSongData(track, artist, album) {
    track = track.replace("'", "");
    artist = artist.replace("'", "");
    album = album.replace("'", "");
    track = track.replace(/\((ft|feat).*\)/i, "");
    artist = artist.replace(/((ft|feat).*)/i, "");
    album = album.replace(/((ft|feat).*)/i, "");
    let data = await spotifyApi.searchTracks(
      "track:" + track + " artist:" + artist + " album:" + album
    );
    if (data.body.tracks.total > 0) {
      return data.body.tracks.items[0];
    }
    return null;
  }

  static async getAudioFeaturesForTracks(tracks) {
    //   Can only take 100 at a time
    let features = [];
    let num_calls = Math.ceil(tracks.length / 100);
    for (let i = 0; i < num_calls; i++) {
      let result = await spotifyApi.getAudioFeaturesForTracks(
        tracks.slice(i * 100, i * 100 + 100)
      );
      features = features.concat(result.body.audio_features);
      await this.sleep(1000);
    }
    return features;
  }
};
