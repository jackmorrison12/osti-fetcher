// import { connectToDatabase } from "../controllers/mongodb";
var LastFMController = require("../api_controllers/lastfm.js");
var DB = require("../database/lastfm");

var express = require("express"),
  router = express.Router();

router.get("/", function (req, res) {
  res.send("Container for lastfm routes");
});

router.post("/userSetup", async function (req, res) {
  const userId = req.body.user_id;
  const user = await DB.getUser(userId);

  // let history = await LastFMController.getUserHistory(user.lastfm_username);

  let history = [
    {
      artist: "Miksu / Macloud",
      album: "Lonely",
      name: "Lonely",
      date: "1612819321",
      image_url:
        "https://lastfm.freetls.fastly.net/i/u/300x300/d0256b56f6641fcb7fd0dec783d20b08.png",
      lastfm_url: "https://www.last.fm/music/Miksu+%2F+Macloud/_/Lonely",
    },
    {
      artist: "Anne-Marie",
      album: "Don't Play",
      name: "Don't Play",
      date: "1612819139",
      image_url:
        "https://lastfm.freetls.fastly.net/i/u/300x300/9d2fae3d7f729e20b532f15b942ca02f.jpg",
      lastfm_url: "https://www.last.fm/music/Anne-Marie/_/Don%27t+Play",
    },
  ];
  // Iterate over history and check if songs aren't already in the database -
  // if not then we add them to songs table, else we add the song id to each listen object, and then put it in the listen table

  // Returns a map from lastfm url to song id
  // songIds = getSongIds(history);

  let songIds = {
    "https://www.last.fm/music/Miksu+%2F+Macloud/_/Lonely": 1,
    "https://www.last.fm/music/Anne-Marie/_/Don%27t+Play": 2,
  };
  // Generate the records which need to be added to the listens table (just songid and datetime of listen)

  let listensToAdd = [];
  for (const r of history) {
    let listen = {};
    listen.song_id = songIds[r.lastfm_url];
    listen.time = r.date;
    listen.user_id = userId;
    listensToAdd.push(listen);
  }

  res.json(listensToAdd);
});

module.exports = router;
