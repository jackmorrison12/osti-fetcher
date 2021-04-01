const listEndpoints = require("express-list-endpoints");

var express = require("express"),
  app = express();

app.listen(process.env.PORT || 3000, function () {
  console.log("listening on 3000");
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

var lastfmRoutes = require("./routes/lastfm");
app.use("/lastfm", lastfmRoutes);

var googlefitRoutes = require("./routes/googlefit");
app.use("/googlefit", googlefitRoutes);
