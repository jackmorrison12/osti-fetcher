require("dotenv").config({
  path: `.env.local`,
});

var LastFMController = require("../api_controllers/lastfm.js");
var SpotifyController = require("../api_controllers/spotify");
var DB = require("../database/music");
var userDB = require("../database/user");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = class MusicController {
  constructor() {}

  static async addListens(user_id, start_time) {
    // Get the user object from the database
    const user = await userDB.getUser(user_id);

    // Get that user's listening history from the LastFM API
    let history = await LastFMController.getUserHistory(
      user.lastfm_username,
      start_time
    );

    if (!history) {
      console.log("No listens found");
      return 0;
    }

    console.log(history.length + " listens found in history");

    // Iterate over history and check if songs aren't already in the database -
    // if not then we add them to songs table, else we add the song id to each listen object,
    // and then put it in the listen table

    // Get a list of lastfm urls of songs already in DB
    let lastfm_urls = history.map((h) => h.lastfm_url);
    let known_songs = await DB.getKnownSongs(lastfm_urls);
    let known_song_urls = known_songs.map((s) => s.lastfm_url);

    // Need to filter out date/imageurl/lastfmurl - just album, name, artist, and then make sure unique
    // Filter out known songs from history
    let unknown_songs = history.filter(
      (i) => !known_song_urls.includes(i.lastfm_url)
    );

    if (unknown_songs.length > 0) {
      // Remove duplicates
      unknown_songs = Array.from(
        new Set(unknown_songs.map((a) => a.lastfm_url))
      ).map((lastfm_url) => {
        return unknown_songs.find((a) => a.lastfm_url === lastfm_url);
      });

      // Filter out listen date
      unknown_songs = unknown_songs.map(({ date, ...rest }) => rest);
      console.log(unknown_songs.length + " songs are unknown");

      // Spotify API method - pass in a list of unknown songs, return data about them from spotify api
      let recognised_songs = [];
      let unrecognised_songs = [];

      for (const song of unknown_songs) {
        let data = await SpotifyController.getSongData(
          song.name,
          song.artist,
          song.album
        );
        if (!data) {
          console.log("Following song could not be found:");
          console.log(song.name);
          console.log(song.artist);
          console.log(song.album);
          unrecognised_songs.push(song);
        } else {
          song.spotify = {};
          song.spotify.uri = data.uri;
          song.spotify.preview = data.preview_url;
          song.spotify.id = data.id;
          song.name = data.name;
          song.features = {};
          song.features.duration = data.duration_ms;
          song.album = {};
          song.album.id = data.album.id;
          song.album.name = data.album.name;
          song.release_date = data.album.release_date;
          song.artist = {};
          song.artist.name = data.artists[0].name;
          song.artist.id = data.artists[0].id;
          song.artists = [];
          for (const a of data.artists) {
            let artist = {};
            artist.name = a.name;
            artist.id = a.id;
            song.artists.push(artist);
          }
          recognised_songs.push(song);
        }
        await sleep(1000);
      }

      console.log(
        recognised_songs.length +
          "/" +
          unknown_songs.length +
          " songs found on Spotify"
      );

      let ids = [];
      for (const s of recognised_songs) {
        ids.push(s.spotify.id);
      }

      let features = await SpotifyController.getAudioFeaturesForTracks(ids);

      for (let i = 0; i < features.length; i++) {
        if (features[i]) {
          recognised_songs[i].features.danceability = features[i].danceability;
          recognised_songs[i].features.energy = features[i].energy;
          recognised_songs[i].features.key = features[i].key;
          recognised_songs[i].features.loudness = features[i].loudness;
          recognised_songs[i].features.mode = features[i].mode;
          recognised_songs[i].features.speechiness = features[i].speechiness;
          recognised_songs[i].features.acousticness = features[i].acousticness;
          recognised_songs[i].features.instrumentalness =
            features[i].instrumentalness;
          recognised_songs[i].features.liveness = features[i].liveness;
          recognised_songs[i].features.valence = features[i].valence;
          recognised_songs[i].features.tempo = features[i].tempo;
          recognised_songs[i].features.time_signature =
            features[i].time_signature;
        } else {
          console.log("No features for: " + recognised_songs[i].name);
        }
      }

      console.log("Spotify features retrieved");

      // DB method - add songs to DB + get IDs
      // Note - unrecognised songs are still added, as there is the opportunity for them
      // to be added manually later
      var all_songs = recognised_songs.concat(unrecognised_songs);
      all_songs = await DB.addTracks(all_songs);
      console.log("New songs added to database");

      // Combine existing IDs with returned IDs
      known_songs = known_songs.concat(all_songs);
    }

    // Translate known_songs to a dict, key url value ObjectID
    let song_ids = {};
    for (const song of known_songs) {
      song_ids[song.lastfm_url] = song._id;
    }

    // Generate the records which need to be added to the listens table (just songid and datetime of listen)
    let listens_to_add = [];
    for (const r of history) {
      let listen = {};
      if (r.lastfm_url in song_ids) {
        listen.song_id = song_ids[r.lastfm_url];
        listen.time = r.date;
        listen.user_id = user_id; // Make sure this is an ObjectID!
        listens_to_add.push(listen);
      }
    }

    // DB Method - Add these listens to the database
    DB.addListens(listens_to_add);
    console.log("Listens added to database");

    return listens_to_add.length;
  }

  static async getRecentListensForUser(user_id) {
    // Look up in the database when their last recorded listen was
    let time = await DB.getLastListenTime(user_id);

    return await this.addListens(user_id, time + 1);
  }

  static async userSetup(user_id) {
    return await this.addListens(user_id, null);
  }
};
