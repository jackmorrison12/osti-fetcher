const listEndpoints = require("express-list-endpoints");

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
