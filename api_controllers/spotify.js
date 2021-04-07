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
    console.log("Access Token Retrieved");

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
    try {
      let data = await spotifyApi.searchTracks(
        "track:" + track + " artist:" + artist + " album:" + album
      );
      if (data.body.tracks.total > 0) {
        return data.body.tracks.items[0];
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  static async getAudioFeaturesForTracks(tracks) {
    // Can only take 100 at a time
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

  static async getAudioFeaturesForTrack(track) {
    let result = await spotifyApi.getAudioFeaturesForTrack(track);
    return result;
  }
};
