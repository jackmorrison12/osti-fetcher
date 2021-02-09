// Code Source: https://github.com/vercel/next.js/blob/canary/examples/with-mongodb/util/mongodb.js

// import { MongoClient } from "mongodb";
var MongoClient = require("mongodb");

require("dotenv").config({
  path: `.env.local`,
});

const { DATABASE_URL, MONGODB_DB } = process.env;

if (!DATABASE_URL) {
  throw new Error(
    "Please define the DATABASE_URL environment variable inside .env.local"
  );
}

if (!MONGODB_DB) {
  throw new Error(
    "Please define the MONGODB_DB environment variable inside .env.local"
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { conn: null, promise: null };
}

module.exports = class DBController {
  static async connectToDatabase() {
    if (cached.conn) {
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      };

      cached.promise = MongoClient.connect(DATABASE_URL, opts).then(
        (client) => {
          return {
            client,
            db: client.db(MONGODB_DB),
          };
        }
      );
    }
    cached.conn = await cached.promise;
    return cached.conn;
  }
};
