const listEndpoints = require("express-list-endpoints");

var GoogleFitController = require("../api_controllers/googlefit.js");
var DB = require("../database/fitness");
var userDB = require("../database/user");

var express = require("express"),
  router = express.Router();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

router.get("/", function (req, res) {
  res.send(
    listEndpoints(router).map(function (item) {
      return item.path + " " + item.methods;
    })
  );
});

router.post("/userSetup", async function (req, res) {});

module.exports = router;
