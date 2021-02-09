var express = require("express"),
  app = express();
let bodyParser = require("body-parser");

app.listen(3000, function () {
  console.log("listening on 3000");
});

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

var lastfmRoutes = require("./routes/lastfm");
app.use("/lastfm", lastfmRoutes);
