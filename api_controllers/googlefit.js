require("dotenv").config({
  path: `.env.local`,
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = class GoogleFitController {
  constructor() {}
};
