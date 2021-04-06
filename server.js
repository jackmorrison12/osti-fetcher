const listEndpoints = require("express-list-endpoints");

var DBController = require("./database/mongodb.js");
var ObjectId = require("mongodb").ObjectId;

var express = require("express"),
  app = express();

app.listen(process.env.PORT || 4000, function () {
  console.log("listening on 4000");
});

app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());

app.get("/", function (req, res) {
  res.send(
    listEndpoints(app).map(function (item) {
      return item.path + " " + item.methods;
    })
  );
});

var musicRoutes = require("./routes/music");
app.use("/music", musicRoutes);

var fitnessRoutes = require("./routes/fitness");
app.use("/fitness", fitnessRoutes);

// Endpoint to test queries in js format
app.post("/test", async function (req, res) {
  const { db } = await DBController.connectToDatabase();
  const status = await db
    .collection("users")
    .find({ _id: ObjectId(req.body.user_id) })
    .project({ status: 1, _id: 0 })
    .toArray();
  res.json(status);
});
