const listEndpoints = require("express-list-endpoints");

var MusicController = require("../controllers/music.js");

var express = require("express"),
  router = express.Router();

router.get("/", function (req, res) {
  res.send(
    listEndpoints(router).map(function (item) {
      return item.path + " " + item.methods;
    })
  );
});

router.post("/userSetup", async function (req, res) {
  listens_added = await MusicController.userSetup(req.body.user_id);
  res.json(listens_added);
});

router.post("/userRefresh", async function (req, res) {
  listens_added = await MusicController.getRecentListensForUser(
    req.body.user_id
  );
  res.json(listens_added);
});

module.exports = router;
