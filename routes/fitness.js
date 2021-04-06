const listEndpoints = require("express-list-endpoints");

var FitnessController = require("../controllers/fitness.js");

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
  let workouts_added = await FitnessController.userSetup(req.body.user_id);
  res.json(workouts_added);
});

module.exports = router;
